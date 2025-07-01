package host_manager

import "github.com/docker/docker/client"

type ManagedMachine struct {
	client *client.Client
}

// MachineOptions defines the configuration for a single machine.
type MachineOptions struct {
	Enable           bool   `yaml:"enable"`
	Host             string `yaml:"host"`
	Port             int    `yaml:"port"`
	User             string `yaml:"user"`
	Password         string `yaml:"password,omitempty"`
	RemotePublicKey  string `yaml:"remote_public_key,omitempty"` // will be set by when connecting to the client
	UsePublicKeyAuth bool   `yaml:"use_public_key_auth"`
}

// ClientConfig structure of the yaml file
type ClientConfig struct {
	EnableLocalDocker bool                      `yaml:"enable_local_docker"`
	Machines          map[string]MachineOptions `yaml:"machines"`
}

func ExampleConfig() *ClientConfig {
	config := MachineOptions{
		Enable:           false,
		Host:             "192.168.1.69",
		Port:             22,
		User:             "zaphodb",
		Password:         "Don’t panic!",
		UsePublicKeyAuth: false,
	}

	return &ClientConfig{
		EnableLocalDocker: true,
		Machines:          map[string]MachineOptions{"example": config},
	}
}
