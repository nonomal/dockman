package ssh

import (
	"github.com/uptrace/bun"
	"time"
)

const DefaultKeyName = "defaultSSHKey"

// KeyManager interface for managing SSH configurations
type KeyManager interface {
	// SaveKey SaveSSHConfig saves an SSH configuration
	SaveKey(config KeyConfig) error
	// GetKey retrieves an SSH configuration by name
	GetKey(name string) (KeyConfig, error)
	// ListKeys returns all SSH configurations
	ListKeys() ([]KeyConfig, error)
	// DeleteKey removes an SSH configuration
	DeleteKey(name string) error
}

type KeyConfig struct {
	bun.BaseModel `bun:"table:ssh_configs,alias:sc"`

	ID         int64  `bun:"id,pk,autoincrement"`
	Name       string `bun:"name,notnull,unique"` // Identifier for the SSH config
	PublicKey  []byte `bun:"public_key,type:blob"`
	PrivateKey []byte `bun:"private_key,type:blob"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

// MachineManager manages machine configurations
type MachineManager interface {
	Write(mach MachineOptions) error
	Delete(mac MachineOptions) error
	List() ([]MachineOptions, error)
	Get(machName string) (MachineOptions, error)
}

// MachineOptions defines the configuration for a single machine.
type MachineOptions struct {
	bun.BaseModel `bun:"table:machine_options,alias:mo"`

	ID               int64  `bun:"id,pk,autoincrement"`
	Name             string `bun:"name,notnull,unique"`
	Enable           bool   `bun:"enable,notnull,default:false"`
	Host             string `bun:"host,notnull"`
	Port             int    `bun:"port,notnull,default:22"`
	User             string `bun:"user,notnull"`
	Password         string `bun:"password,nullzero"`
	RemotePublicKey  string `bun:"remote_public_key,nullzero"`
	UsePublicKeyAuth bool   `bun:"use_public_key_auth,notnull,default:false"`

	// Standard timestamps
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

// ClientConfig structure of the yaml file
type ClientConfig struct {
	DefaultHost       string                    `yaml:"default_host"`
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
		DefaultHost:       "local",
		EnableLocalDocker: true,
		Machines:          map[string]MachineOptions{"example": config},
	}
}
