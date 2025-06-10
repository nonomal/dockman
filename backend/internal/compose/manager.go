package compose

import (
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/goccy/go-yaml"
	"github.com/rs/zerolog/log"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const dockManConfFileName = ".dockman.yaml"

type Manager struct {
	configPath string
	*FileAssociations
}

func CreateFile(name string) error {
	f, err := os.OpenFile(name, os.O_RDONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer closeFile(f)

	return nil
}

func NewManager(parentDir string, filePatterns ...string) *Manager {
	if !strings.HasSuffix(parentDir, "/") {
		parentDir = parentDir + "/"
	}

	confName := fmt.Sprintf("%s%s", parentDir, dockManConfFileName)
	err := CreateFile(confName)
	if err != nil {
		log.Fatal().Err(err).Str("name", confName).Msg(" failed create dockman config file")
	}

	man := Manager{configPath: confName}

	if err = man.Read(); err != nil {
		log.Fatal().Err(err).Msg("unable to read dockman config")
	}

	// always import these
	defaultImports := []string{"*.yaml", "*.yml"}
	defaultImports = append(defaultImports, filePatterns...)

	if err = man.AutoImport(defaultImports...); err != nil {
		log.Fatal().Err(err).Msg("unable to auto import files")
	}

	if err = man.WriteFresh(); err != nil {
		log.Fatal().Err(err).Msg("unable to load dockman config")
	}

	return &man
}

func (c *Manager) Read() error {
	yam, err := c.openConfig()
	if err != nil {
		return err
	}
	defer closeFile(yam)

	reader := yaml.NewDecoder(yam)

	fa := FileAssociations{files: &pkg.Map[string, string]{}}

	var data map[string]string
	if err = reader.Decode(&data); err != nil && err != io.EOF {
		return err
	}

	fa.LoadMap(data)
	c.FileAssociations = &fa
	return nil
}

func (c *Manager) Write() error {
	yam, err := c.openConfig()
	if err != nil {
		return err
	}
	defer closeFile(yam)

	writer := yaml.NewEncoder(yam)

	if err = writer.Encode(c.FileAssociations.ToMap()); err != nil {
		return err
	}

	if err = writer.Close(); err != nil {
		return err
	}

	return nil
}

func (c *Manager) AutoImport(globPatterns ...string) error {
	dirs, err := os.ReadDir(filepath.Dir(c.configPath))
	if err != nil {
		return err
	}

	for _, dir := range dirs {
		if dir.IsDir() {
			log.Info().Str("dir", dir.Name()).Msg("will not import directories")
			continue
		}

		filename := dir.Name()
		if filename == dockManConfFileName {
			continue
		}

		_, ok := c.GetVal(filename)
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
				if err = c.Insert(filename, ""); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// WriteFresh subway eat fresh
//
// By a level 7 susceptible
func (c *Manager) WriteFresh() error {
	if err := c.Write(); err != nil {
		return err
	}

	if err := c.Read(); err != nil {
		return err
	}

	return nil
}

func (c *Manager) openConfig() (*os.File, error) {
	yam, err := os.OpenFile(c.configPath, os.O_RDWR|os.O_CREATE, 0660)
	if err != nil {
		return nil, err
	}

	return yam, nil
}

func closeFile(rw io.Closer) {
	err := rw.Close()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to close io.Closer")
	}
}
