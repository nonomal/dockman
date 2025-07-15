package ssh

import (
	"errors"
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/goccy/go-yaml"
	"github.com/rs/zerolog/log"
	"os"
	"path/filepath"
	"sync"
)

type ConfigManager struct {
	mu         sync.Mutex
	configPath string
	config     *ClientConfig
}

func NewConfigManager(basedir string) (*ConfigManager, error) {
	confPath, err := filepath.Abs(filepath.Join(basedir, "hosts.yaml"))
	if err != nil {
		return nil, err
	}

	config := ConfigManager{
		mu:         sync.Mutex{},
		configPath: confPath,
		config: &ClientConfig{ // default should be overwritten by read
			Machines:          make(map[string]MachineOptions),
			EnableLocalDocker: false,
		},
	}

	yamlFile, err := os.ReadFile(confPath)
	// If the file does not exist or is empty, create a default one
	if errors.Is(err, os.ErrNotExist) || (err == nil && len(yamlFile) == 0) {
		log.Info().Str("path", confPath).Msg("hosts.yaml file not found or empty config file, setting default values...")

		file, err := os.OpenFile(confPath, os.O_RDWR|os.O_CREATE, 0600)
		if err != nil {
			return nil, err
		}
		defer pkg.CloseCloser(file)

		config.config = ExampleConfig()
		if err = config.Write(); err != nil {
			return nil, err
		}
	}

	if err = config.Read(); err != nil {
		return nil, err
	}

	return &config, nil
}

func (manager *ConfigManager) WriteAndSave(name string, mach MachineOptions) error {
	manager.WriteMachine(name, mach)
	return manager.Write()
}

func (manager *ConfigManager) WriteMachine(name string, mach MachineOptions) {
	manager.mu.Lock()
	defer manager.mu.Unlock()
	manager.config.Machines[name] = mach
}

func (manager *ConfigManager) Write() error {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	data, err := yaml.Marshal(manager.config)
	if err != nil {
		return fmt.Errorf("failed to marshal config to YAML: %w", err)
	}

	err = os.WriteFile(manager.configPath, data, 0644)
	if err != nil {
		return fmt.Errorf("failed to write config to file %s: %w", manager.configPath, err)
	}

	return nil
}

func (manager *ConfigManager) Read() error {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	data, err := os.ReadFile(manager.configPath)
	if err != nil {
		return fmt.Errorf("failed to read config file %s: %w", manager.configPath, err)
	}

	err = yaml.Unmarshal(data, manager.config)
	if err != nil {
		return fmt.Errorf("failed to unmarshal YAML from %s: %w", manager.configPath, err)
	}

	return nil
}

func (manager *ConfigManager) List() ClientConfig {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	return *manager.config
}

func (manager *ConfigManager) Get(machName string) MachineOptions {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	return manager.config.Machines[machName]
}
