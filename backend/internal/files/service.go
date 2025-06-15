package files

import (
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
)

type Service struct {
	composeRoot string
	Fdb         FileDB
}

func NewService(composeRoot string, importPatterns ...string) *Service {
	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	if err := os.MkdirAll(composeRoot, 0755); err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).Msg("failed to create compose root folder")
	}

	srv := &Service{
		composeRoot: composeRoot,
		Fdb:         NewBoltConfig(composeRoot),
	}

	importPatterns = append(importPatterns, "*.yaml", "*.yml") //default
	if err := srv.AutoImport(importPatterns...); err != nil {
		log.Fatal().Err(err).Msg("failed to auto import files")
	}

	return srv
}

func (s *Service) Close() error {
	return s.Fdb.Close()
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
		if filename == BoltFileDBName {
			continue
		}

		ok, err := s.Fdb.Exists(filename)
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
				if err = s.Fdb.Insert(filename, ""); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func (s *Service) List() (map[string][]string, error) {
	return s.Fdb.List()
}

func (s *Service) Create(fileName, parent string) error {
	if err := s.createFile(fileName); err != nil {
		return err
	}

	if err := s.Fdb.Insert(fileName, parent); err != nil {
		return err
	}

	return nil
}

func (s *Service) Delete(fileName string) error {
	fullpath := s.getPath(fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	if err := s.Fdb.Delete(fileName); err != nil {
		return err
	}

	return nil
}

func (s *Service) Save(filename string, destWriter io.Reader) error {
	return s.withFile(filename, func(filename string) error {
		filename = s.getPath(filename)

		read, err := io.ReadAll(destWriter)
		if err != nil {
			return err
		}

		err = os.WriteFile(filename, read, os.ModePerm)
		if err != nil {
			return err
		}
		return nil
	})
}

func (s *Service) Load(filename string) (string, error) {
	if err := s.withFile(
		filename,
		func(filename string) error { return nil },
	); err != nil {
		return "", err
	}
	return s.getPath(filename), nil
}

func (s *Service) createFile(filename string) error {
	f, err := s.openFile(filename)
	if err != nil {
		return err
	}

	pkg.CloseFile(f)
	return nil
}

func (s *Service) openFile(filename string) (*os.File, error) {
	filename = s.getPath(filename)
	return os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
}

func (s *Service) getPath(filename string) string {
	return filepath.Join(s.composeRoot, filename)
}

// checks verifies file existence
func (s *Service) withFile(filename string, execFn func(filename string) error) error {
	ok, err := s.Fdb.Exists(filename)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("file %s does not exist", filename)
	}

	return execFn(filename)
}
