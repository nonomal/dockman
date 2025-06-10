package compose

import (
	"bufio"
	"fmt"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
)

type Service struct {
	composeRoot string
	man         *Manager
}

func NewService(composeRoot string) *Service {
	abs, err := filepath.Abs(composeRoot)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get absolute path for compose root")
	}
	composeRoot = abs

	if err = os.MkdirAll(composeRoot, 0755); err != nil {
		log.Fatal().Err(err).Str("compose-root", composeRoot).Msg("failed to create compose root folder")
	}

	man := NewManager(composeRoot)
	return &Service{composeRoot: composeRoot, man: man}
}

func (s *Service) List() (map[string][]string, error) {
	return s.man.List(), nil
}

func (s *Service) Create(fileName, parent string) error {
	if err := s.CreateFile(fileName); err != nil {
		return err
	}

	if err := s.man.Insert(fileName, parent); err != nil {
		return err
	}

	if err := s.man.WriteFresh(); err != nil {
		return err
	}

	return nil
}

func (s *Service) Delete(fileName string) error {
	fullpath := s.getPath(fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	s.man.Delete(fileName)

	if err := s.man.WriteFresh(); err != nil {
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

func (s *Service) Save(filename string, contents []byte) error {
	ok := s.man.Exists(filename)
	if !ok {
		return fmt.Errorf("file %s does not exist", filename)
	}

	return os.WriteFile(s.getPath(filename), contents, os.ModePerm)
}

func (s *Service) Load(filename string) (*bufio.Reader, io.Closer, error) {
	file, err := os.Open(s.getPath(filename))
	if err != nil {
		return nil, nil, err
	}

	return bufio.NewReader(file), file, nil
}
