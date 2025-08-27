package files

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"

	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

var ignoredFiles = []string{".git"}

type Service struct {
	composeRoot string
}

func NewService(composeRoot string) *Service {
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

	log.Debug().Msg("File service loaded successfully")
	return &Service{
		composeRoot: composeRoot,
	}
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

	eg := errgroup.Group{}

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

		eg.Go(func() error {
			fullPath := s.WithRoot(entryName)
			files, err := listFiles(fullPath)
			if err != nil {
				log.Warn().Err(err).Str("path", fullPath).Msg("error listing subdir")
				return nil
			}

			subDirChan <- dirResult{
				fileList: files,
				dirname:  entryName,
			}
			return nil
		})
	}

	go func() {
		_ = eg.Wait()
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

type SearchResults struct {
}

type File struct {
	path string
	// a list of
	// line and column matches
	// 0,1 will be match start,
	// 2,3 will be match end
	contentMatch [][4]int
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
