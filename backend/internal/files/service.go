package files

import (
	"fmt"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
)

type Service struct {
	composeRoot string
	fdb         FileDB
}

func NewService(composeRoot string, importPatterns ...string) *Service {
	abs, err := filepath.Abs(composeRoot)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get absolute path for compose root")
	}
	composeRoot = abs

	if err = os.MkdirAll(composeRoot, 0755); err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).Msg("failed to create compose root folder")
	}

	srv := &Service{
		composeRoot: composeRoot,
		fdb:         NewBoltConfig(composeRoot),
	}

	importPatterns = append(importPatterns, "*.yaml", "*.yml") //default
	if err = srv.AutoImport(importPatterns...); err != nil {
		log.Fatal().Err(err).Msg("failed to auto import files")
	}

	return srv
}

func (s *Service) Close() error {
	return s.fdb.Close()
}

func (s *Service) List() (map[string][]string, error) {
	return s.fdb.List()
}

func (s *Service) AutoImport(globPatterns ...string) error {
	dirs, err := os.ReadDir(s.composeRoot)
	if err != nil {
		return err
	}

	for _, dir := range dirs {
		if dir.IsDir() {
			log.Info().Str("dir", dir.Name()).Msg("will not import directories")
			continue
		}

		filename := dir.Name()
		if filename == boltFileDBName {
			continue
		}

		ok, err := s.fdb.Exists(filename)
		if err != nil {
			return err
		}
		if ok {
			continue // already being tracked
		}

		for _, ext := range globPatterns {
			match, err := filepath.Match(ext, filename)
			if err != nil {
				return err
			}

			if match {
				// add as parent
				if err = s.fdb.Insert(filename, ""); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func (s *Service) Create(fileName, parent string) error {
	if err := s.CreateFile(fileName); err != nil {
		return err
	}

	if err := s.fdb.Insert(fileName, parent); err != nil {
		return err
	}

	return nil
}

func (s *Service) Delete(fileName string) error {
	fullpath := s.getPath(fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	if err := s.fdb.Delete(fileName); err != nil {
		return err
	}

	return nil
}

func (s *Service) CreateFile(filename string) error {
	f, err := s.OpenFile(filename)
	if err != nil {
		return err
	}

	closeFile(f)
	return nil
}

func (s *Service) OpenFile(filename string) (*os.File, error) {
	filename = s.getPath(filename)
	return os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
}

func (s *Service) getPath(filename string) string {
	return filepath.Join(s.composeRoot, filename)
}

func (s *Service) Save(filename string, destWriter io.Reader) error {
	ok, err := s.fdb.Exists(filename)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("file %s does not exist", filename)
	}

	srcFile, err := os.OpenFile(s.getPath(filename), os.O_RDWR, os.ModePerm)
	if err != nil {
		return err
	}

	_, err = io.Copy(srcFile, destWriter)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) Load(filename string) (string, error) {
	ok, err := s.fdb.Exists(filename)
	if err != nil {
		return "", err
	}
	if !ok {
		return "", fmt.Errorf("file %s does not exist", filename)
	}
	return s.getPath(filename), nil
}

func closeFile(rw io.Closer) {
	err := rw.Close()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to close io.Closer")
	}
}
