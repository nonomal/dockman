package impl

import (
	"github.com/RA341/dockman/internal/ssh"
	"gorm.io/gorm"
)

// KeyManagerDB handles database operations for SSH key configurations.
type KeyManagerDB struct {
	db *gorm.DB
}

// NewKeyManagerDB creates a new instance of KeyManagerDB.
func NewKeyManagerDB(db *gorm.DB) *KeyManagerDB {
	return &KeyManagerDB{db: db}
}

// SaveKey inserts a new SSH key configuration or updates an existing one based on the primary key ID.
func (k KeyManagerDB) SaveKey(config ssh.KeyConfig) error {
	return k.db.Save(&config).Error
}

// GetKey retrieves a single SSH key configuration by its name.
func (k KeyManagerDB) GetKey(name string) (ssh.KeyConfig, error) {
	var config ssh.KeyConfig
	err := k.db.Where("name = ?", name).First(&config).Error
	return config, err
}

// ListKeys retrieves all SSH key configurations from the database.
func (k KeyManagerDB) ListKeys() ([]ssh.KeyConfig, error) {
	var configs []ssh.KeyConfig
	err := k.db.Find(&configs).Error
	return configs, err
}

// DeleteKey removes an SSH key configuration from the database by its name.
func (k KeyManagerDB) DeleteKey(name string) error {
	return k.db.Where("name = ?", name).Delete(&ssh.KeyConfig{}).Error
}
