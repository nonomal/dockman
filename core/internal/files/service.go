package files

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"dario.cat/mergo"
	"github.com/RA341/dockman/internal/docker"
	"github.com/RA341/dockman/internal/git"
	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/goccy/go-yaml"
	"github.com/rs/zerolog/log"
)

type ActiveMachineFolderProvider func() string

type Service struct {
	machineFolder ActiveMachineFolderProvider
	composeRoot   func() string
	dockYamlPath  string
	guid          int
	puid          int

	lastModTime time.Time
	cachedYaml  *DockmanYaml
}

func NewService(
	composeRoot, dockYaml string,
	puid, guid int,
	machineFolder ActiveMachineFolderProvider,
) *Service {
	if !filepath.IsAbs(composeRoot) {
		var err error
		composeRoot, err = filepath.Abs(composeRoot)
		if err != nil {
			log.Fatal().Str("path", composeRoot).Msg("Err getting abs path for composeRoot")
		}
	}

	if err := os.MkdirAll(composeRoot, 0755); err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).Msg("failed to create compose root folder")
	}

	prov := func() string {
		mach := machineFolder()
		if mach == docker.LocalClient {
			// return normal compose root for local client
			return composeRoot
		}
		return filepath.Join(composeRoot, git.DockmanRemoteFolder, mach)
	}

	srv := &Service{
		composeRoot:   prov,
		guid:          guid,
		puid:          puid,
		machineFolder: machineFolder,
	}

	if dockYaml != "" {
		if strings.HasPrefix(dockYaml, "/") {
			// Absolute path provided
			// e.g /home/zaphodb/conf/.dockman.db
			srv.dockYamlPath = dockYaml
		} else {
			// Relative path; attach compose root
			// e.g. dockman/.dockman.yml
			srv.dockYamlPath = srv.WithRoot(dockYaml)
		}
	}

	log.Debug().Msg("File service loaded successfully")
	return srv
}

func (s *Service) Close() error {
	return nil
}

type dirResult struct {
	fileList []string
	dirname  string
}

func (s *Service) List() (map[string][]string, error) {
	err := os.MkdirAll(s.composeRoot(), os.ModePerm)
	if err != nil {
		return nil, err
	}

	topLevelEntries, err := os.ReadDir(s.composeRoot())
	if err != nil {
		return nil, fmt.Errorf("failed to list files in compose root: %v", err)
	}
	result := make(map[string][]string, len(topLevelEntries))

	eg := sync.WaitGroup{}

	subDirChan := make(chan dirResult, len(topLevelEntries))

	var ignoredFiles = []string{".git", git.DockmanRemoteFolder}

	for _, entry := range topLevelEntries {
		entryName := entry.Name()
		if slices.Contains(ignoredFiles, entryName) {
			continue
		}

		if !entry.IsDir() {
			result[entryName] = []string{}
			continue
		}

		eg.Go(func() {
			fullPath := s.WithRoot(entryName)
			files, err := listFiles(fullPath)
			if err != nil {
				log.Warn().Err(err).Str("path", fullPath).Msg("error listing subdir")
				return
			}

			subDirChan <- dirResult{
				fileList: files,
				dirname:  entryName,
			}
		})
	}

	go func() {
		eg.Wait()
		close(subDirChan)
	}()

	for item := range subDirChan {
		if len(item.fileList) == 0 {
			// do not send empty dirs
			continue
		}

		result[item.dirname] = item.fileList
	}

	return result, nil
}

func (s *Service) Create(fileName string) error {
	if err := s.createFile(fileName); err != nil {
		return err
	}

	return nil
}

func (s *Service) GetDockmanYaml() *DockmanYaml {
	filenames := []string{dockmanYamlFileYml, dockmanYamlFileYaml}
	var finalPath string
	var stat os.FileInfo

	// Determine which file to use
	if s.dockYamlPath != "" {
		stat = fileutil.StatFileIfExists(s.dockYamlPath)
		if stat != nil {
			finalPath = s.dockYamlPath
		}
	} else {
		for _, filename := range filenames {
			path := s.WithRoot(filename)
			stat = fileutil.StatFileIfExists(path)
			if stat != nil {
				finalPath = path
				break
			}
		}
	}

	// If no file is found, return a default config
	if stat == nil {
		// log.Warn().Msg("unable to find a dockman yaml file, using defaults")
		return &defaultDockmanYaml
	}

	// Check if the file has been modified since last read
	if !stat.ModTime().After(s.lastModTime) && s.cachedYaml != nil {
		//log.Debug().Msg("Returning cached version")
		return s.cachedYaml // Return cached version
	}

	// File is new or has been modified, load it
	file, err := os.ReadFile(finalPath)
	if err != nil {
		// log.Warn().Err(err).Str("path", finalPath).Msg("failed to read dockman yaml")
		return &defaultDockmanYaml
	}

	// Start with defaults, then merge the loaded config
	config := defaultDockmanYaml
	var override DockmanYaml
	if err := yaml.Unmarshal(file, &override); err != nil {
		// log.Warn().Err(err).Msg("failed to parse dockman yaml")
		return &config
	}

	// Merge override into config
	if err := mergo.Merge(&config, &override, mergo.WithOverride); err != nil {
		// log.Warn().Err(err).Msg("failed to merge dockman yaml configs")
		return &defaultDockmanYaml
	}

	// Update cache with new data and modification time
	s.lastModTime = stat.ModTime()
	s.cachedYaml = &config

	//log.Debug().Msg("Returning fresh version")
	return s.cachedYaml
}

func (s *Service) Exists(filename string) error {
	stat, err := os.Stat(s.WithRoot(filename))
	if err != nil {
		return err
	}
	if stat.IsDir() {
		return fmt.Errorf("%s is a directory, cannot be opened", filename)
	}

	return nil
}

func (s *Service) Delete(fileName string) error {
	fullpath := s.WithRoot(fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	return nil
}

func (s *Service) Rename(oldFileName, newFilename string) error {
	oldFullPath := s.WithRoot(filepath.ToSlash(filepath.Clean(oldFileName)))
	newFullPath := s.WithRoot(filepath.ToSlash(filepath.Clean(newFilename)))

	err := os.Rename(oldFullPath, newFullPath)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) Save(filename string, destWriter io.Reader) error {
	filename = s.WithRoot(filename)
	read, err := io.ReadAll(destWriter)
	if err != nil {
		return err
	}

	if err = os.WriteFile(filename, read, os.ModePerm); err != nil {
		return err
	}
	return nil
}

func (s *Service) getFileContents(filename string) ([]byte, error) {
	file, err := os.ReadFile(s.WithRoot(filepath.ToSlash(filename)))
	if err != nil {
		return nil, err
	}
	return file, nil
}

func (s *Service) LoadFilePath(filename string) (string, error) {
	return s.WithRoot(filename), nil
}

func (s *Service) createFile(filename string) error {
	filename = s.WithRoot(filename)
	baseDir := filepath.Dir(filename)
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return err
	}

	f, err := openFile(filename)
	if err != nil {
		return err
	}

	fileutil.Close(f)
	return nil
}

// WithRoot joins s.composeRoot() with filename
func (s *Service) WithRoot(filename string) string {
	return filepath.Join(s.composeRoot(), filename)
}

func (s *Service) Format(filename string) ([]byte, error) {
	path := s.WithRoot(filename)
	contents, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("unable to read file %w", err)
	}

	ext := filepath.Ext(filename)
	formatter, ok := availableFormatters[ext]
	if ok {
		return formatter(contents)
	}

	return contents, nil
}

func openFile(filename string) (*os.File, error) {
	return os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
}

func listFiles(path string) ([]string, error) {
	subEntries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	filesInSubDir := make([]string, 0, len(subEntries))
	for _, subEntry := range subEntries {
		if !subEntry.IsDir() {
			filesInSubDir = append(filesInSubDir, subEntry.Name())
		}
	}

	return filesInSubDir, nil
}
