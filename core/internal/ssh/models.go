package ssh

import (
	"github.com/RA341/dockman/pkg/fileutil"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"
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
	gorm.Model
	Name       string `gorm:"not null;unique"` // Identifier for the SSH config
	PublicKey  []byte `gorm:"type:blob"`
	PrivateKey []byte `gorm:"type:blob"`
}

// TableName specifies the table name for the KeyConfig model
func (KeyConfig) TableName() string {
	return "ssh_configs"
}

// MachineManager manages machine configurations
type MachineManager interface {
	Save(mach *MachineOptions) error
	Delete(mac *MachineOptions) error
	List() ([]MachineOptions, error)
	Get(machName string) (MachineOptions, error)
	GetByID(id uint) (MachineOptions, error)
}

// MachineOptions defines the configuration for a single machine.
type MachineOptions struct {
	gorm.Model

	Name             string `gorm:"not null;uniqueIndex"`
	Enable           bool   `gorm:"not null;default:false"`
	Host             string `gorm:"not null"`
	Port             int    `gorm:"not null;default:22"`
	User             string `gorm:"not null"`
	Password         string
	RemotePublicKey  string
	UsePublicKeyAuth bool `gorm:"not null;default:false"`
}

// TableName specifies the custom table name for the model.
func (m *MachineOptions) TableName() string {
	return "machine_options"
}

type ConnectedMachine struct {
	SshClient  *ssh.Client
	SftpClient *SftpClient
}

func NewConnectedMachine(sshClient *ssh.Client, sftpClient *SftpClient) *ConnectedMachine {
	return &ConnectedMachine{
		SshClient:  sshClient,
		SftpClient: sftpClient,
	}
}

// Close return error to fulfill io.closer we don't need to use it
func (c *ConnectedMachine) Close() error {
	fileutil.Close(c.SftpClient.sfCli)
	fileutil.Close(c.SshClient)
	return nil
}

// ClientConfig structure of the yaml file
type ClientConfig struct {
	DefaultHost       string                    `yaml:"default_host"`
	EnableLocalDocker bool                      `yaml:"enable_local_docker"`
	Machines          map[string]MachineOptions `yaml:"machines"`
}
