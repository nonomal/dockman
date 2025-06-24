package files

import (
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
	"slices"
	"sync"
)

type Service struct {
	composeRoot string
}

func NewService(composeRoot string) *Service {
	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	if err := os.MkdirAll(composeRoot, 0755); err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).Msg("failed to create compose root folder")
	}

	return &Service{
		composeRoot: composeRoot,
	}
}

func (s *Service) Close() error {
	return nil
}

func (s *Service) List() (map[string][]string, error) {
	topLevelEntries, err := os.ReadDir(s.composeRoot)
	if err != nil {
		return nil, err
	}
	result := make(map[string][]string, len(topLevelEntries))

	wg := &sync.WaitGroup{}
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

		wg.Add(1)
		go func(entryName string) {
			defer wg.Done()
			fullPath := s.WithPath(entryName)
			files, err := listFiles(fullPath)

			subDirChan <- dirResult{
				fileList: files,
				dirname:  entryName,
				err:      err,
			}
		}(entryName)
	}

	go func() {
		wg.Wait()
		close(subDirChan)
	}()

	for item := range subDirChan {
		if item.err != nil {
			return nil, item.err
		}

		if len(item.fileList) != 0 {
			// do not send empty dirs
			result[item.dirname] = item.fileList
		}
	}

	return result, nil
}

func (s *Service) Create(fileName string) error {
	if err := s.createFile(fileName); err != nil {
		return err
	}
	return nil
}

func (s *Service) Exists(filename string) error {
	stat, err := os.Stat(s.WithPath(filename))
	if err != nil {
		return err
	}
	if stat.IsDir() {
		return fmt.Errorf("%s is a directory, cannot be opened", filename)
	}

	return nil
}

func (s *Service) Delete(fileName string) error {
	fullpath := s.WithPath(fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	return nil
}

func (s *Service) Save(filename string, destWriter io.Reader) error {
	filename = s.WithPath(filename)
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
	return s.WithPath(filename), nil
}

func (s *Service) createFile(filename string) error {
	filename = s.WithPath(filename)
	baseDir := filepath.Dir(filename)
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return err
	}

	f, err := openFile(filename)
	if err != nil {
		return err
	}

	pkg.CloseFile(f)
	return nil
}

func openFile(filename string) (*os.File, error) {
	return os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
}

func (s *Service) WithPath(filename string) string {
	return filepath.Join(s.composeRoot, filename)
}

type dirResult struct {
	fileList []string
	dirname  string
	err      error
}

var ignoredFiles = []string{".git"}

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
