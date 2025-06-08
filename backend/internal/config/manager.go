package config

import (
	"fmt"
	"github.com/goccy/go-yaml"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
	"sync"
)

type Manager struct {
	*FileManager
	configFilename string
	confLock       sync.Mutex
}

// Load composeDir must end with a '/'
func Load(parentDir string, importFileTypes ...string) (*Manager, error) {
	confName := fmt.Sprintf("%s.dockman.yaml", parentDir)
	man := &Manager{configFilename: confName}

	if err := man.Read(); err != nil {
		return nil, err
	}

	if err := man.autoImport(parentDir, importFileTypes); err != nil {
		return nil, err
	}

	if err := man.WriteFresh(); err != nil {
		return nil, err
	}

	return man, nil
}

func (m *Manager) Read() error {
	m.confLock.Lock()
	defer m.confLock.Unlock()

	yam, err := m.openConfig()
	if err != nil {
		return err
	}
	defer closeConfFile(yam)

	reader := yaml.NewDecoder(yam)

	var data FileManager
	err = reader.Decode(&data)

	// load default val if conf is empty
	if err != nil {
		if err != io.EOF {
			return err
		}

		// default struct for empty config
		data = FileManager{Files: make(map[string]*FileGroup)}
	}

	m.FileManager = &data
	return nil
}

func (m *Manager) Write() error {
	m.confLock.Lock()
	defer m.confLock.Unlock()

	yam, err := m.openConfig()
	if err != nil {
		return err
	}
	defer closeConfFile(yam)

	writer := yaml.NewEncoder(yam)

	if err = writer.Encode(m.FileManager); err != nil {
		return err
	}

	if err = writer.Close(); err != nil {
		return err
	}

	return nil
}

// WriteFresh subway eat fresh
// level 7 susceptible
func (m *Manager) WriteFresh() error {
	if err := m.Write(); err != nil {
		return err
	}

	if err := m.Read(); err != nil {
		return err
	}

	return nil
}

// auto imports all yaml files and other mentioned in filetypes
func (m *Manager) autoImport(parentDir string, filetypes []string) error {
	if parentDir == "" {
		parentDir = "."
	}

	dirs, err := os.ReadDir(parentDir)
	if err != nil {
		return err
	}

	// yaml default skip dockman config
	filetypes = append(filetypes, "*.yaml", "*.yml")
	matchingFiles := make([]string, 0)

	log.Debug().Strs("filter", filetypes).Msg("importing all files matching filter")

	for _, d := range dirs {
		filename := d.Name()

		for _, pattern := range filetypes {
			matched, err := filepath.Match(pattern, filename)
			if err != nil {
				return fmt.Errorf("malformed glob pattern '%s': %v\n", pattern, err)
			}

			if matched {
				matchingFiles = append(matchingFiles, filename)
				break
			}
		}
	}

	for _, filename := range matchingFiles {
		if err = m.FileManager.Insert(filename); err != nil {
			log.Debug().Err(err).Str("filename", filename).Msg("file already exists")
			continue
		}
	}

	return nil
}

func (m *Manager) openConfig() (*os.File, error) {
	yam, err := os.OpenFile(m.configFilename, os.O_RDWR|os.O_CREATE, 0660)
	if err != nil {
		return nil, err
	}

	return yam, nil
}

func closeConfFile(rw io.ReadWriteCloser) {
	err := rw.Close()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to close config.yaml")
	}
}
