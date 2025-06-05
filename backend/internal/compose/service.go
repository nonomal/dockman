package compose

import (
	"fmt"
	"os"
	"path/filepath"
)

type Service struct {
	composeRoot string
}

func New(composeRoot string) (*Service, error) {
	srv := &Service{composeRoot: composeRoot}
	if err := srv.Init(); err != nil {
		return nil, err
	}
	return srv, nil
}

func (s *Service) Init() error {
	err := os.MkdirAll(s.composeRoot, 0755)
	if err != nil {
		return fmt.Errorf("unable to create dir at %s: %v", s.composeRoot, err)
	}

	// todo check or init git service

	return nil
}

func (s *Service) Load(filename string) ([]byte, error) {
	return os.ReadFile(filename)
}

func (s *Service) Save(filename string, contents []byte) error {
	return os.WriteFile(filename, contents, os.ModePerm)
}

func (s *Service) List() ([]string, error) {
	dirs, err := os.ReadDir(s.composeRoot)
	if err != nil {
		return nil, err
	}

	files := make([]string, 0)
	for _, d := range dirs {
		files = append(files, d.Name())
	}

	return files, nil
}

func (s *Service) Update(filename string) error {
	// todo
	return fmt.Errorf("unimplmented")
}

func (s *Service) Delete(fileName string) error {
	if fileName == "" {
		return fmt.Errorf("file name is empty")
	}

	fullpath := filepath.Join(s.composeRoot, fileName)
	if err := os.RemoveAll(fullpath); err != nil {
		return err
	}

	return nil
}

// Create a compose.yaml at root
func (s *Service) Create(fileName string) error {
	if fileName == "" {
		return fmt.Errorf("file name is empty")
	}

	fullpath := filepath.Join(s.composeRoot, fileName)
	if err := os.MkdirAll(fullpath, os.ModePerm); err != nil {
		return err
	}

	return nil
}
