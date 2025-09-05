package files

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"sync"

	"dario.cat/mergo"
	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/goccy/go-yaml"
	"github.com/rs/zerolog/log"
)

var ignoredFiles = []string{".git"}

type Service struct {
	composeRoot  string
	dockYamlPath string

	guid int
	puid int
}

func NewService(composeRoot, dockYaml string, puid, guid int) *Service {
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

	srv := &Service{
		composeRoot: composeRoot,
		guid:        guid,
		puid:        puid,
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

	err := srv.ChownComposeRoot()
	if err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).
			Msg("Failed to change permissions in compose-root")
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
	topLevelEntries, err := os.ReadDir(s.composeRoot)
	if err != nil {
		return nil, fmt.Errorf("failed to list files in compose root: %v", err)
	}
	result := make(map[string][]string, len(topLevelEntries))

	eg := sync.WaitGroup{}

	subDirChan := make(chan dirResult, len(topLevelEntries))
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

	err := s.chown(s.WithRoot(fileName))
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) chown(fileName string) error {
	if runtime.GOOS == "windows" {
		//log.Debug().Msg("chowning files on windows is not supported")
		return nil
	}

	err := os.Chown(fileName, s.puid, s.guid)
	if err != nil {
		return fmt.Errorf("unable to chown path %s: %w", fileName, err)
	}
	return nil
}

func (s *Service) ChownComposeRoot() error {
	err := filepath.Walk(s.composeRoot, func(path string, info os.FileInfo, err error) error {
		if err = s.chown(path); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) GetDockmanYaml() *DockmanYaml {
	filenames := []string{dockmanYamlFileYml, dockmanYamlFileYaml}

	// start with defaults
	var config = defaultDockmanYaml

	var file []byte
	var err error

	if s.dockYamlPath != "" {
		file, err = os.ReadFile(s.dockYamlPath)
	} else {
		for _, filename := range filenames {
			file, err = os.ReadFile(s.WithRoot(filename))
			if err == nil {
				break
			}
		}
		// generates too many logs be careful
		if err != nil {
			//log.Warn().Err(err).Strs("tried", filenames).Msg("unable to open dockman yaml")
			return &config
		}
	}

	var override DockmanYaml
	if err := yaml.Unmarshal(file, &override); err != nil {
		//log.Warn().Err(err).Msg("failed to parse dockman yaml")
	}

	// Merge override into config, override values win
	err = mergo.Merge(&config, &override, mergo.WithOverride)
	if err != nil {
		return &config
	}

	return &config
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

// WithRoot joins s.composeRoot with filename
func (s *Service) WithRoot(filename string) string {
	return filepath.Join(s.composeRoot, filename)
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
