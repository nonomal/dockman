package impl

import (
	"context"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/uptrace/bun"
	"time"
)

// KeyManagerDB handles database operations for SSH key configurations.
type KeyManagerDB struct {
	db *bun.DB
}

// NewKeyManagerDB creates a new instance of KeyManagerDB.
func NewKeyManagerDB(db *bun.DB) *KeyManagerDB {
	return &KeyManagerDB{db: db}
}

// SaveKey inserts a new SSH key configuration or updates an existing one based on the name.
func (k KeyManagerDB) SaveKey(config ssh.KeyConfig) error {
	_, err := k.db.NewInsert().
		Model(&config).
		On("CONFLICT (name) DO UPDATE").
		Set("public_key = EXCLUDED.public_key").
		Set("private_key = EXCLUDED.private_key").
		Set("updated_at = ?", time.Now()).
		Exec(context.Background())
	return err
}

// GetKey retrieves a single SSH key configuration by its name.
func (k KeyManagerDB) GetKey(name string) (ssh.KeyConfig, error) {
	var config ssh.KeyConfig
	err := k.db.NewSelect().
		Model(&config).
		Where("name = ?", name).
		Scan(context.Background())
	return config, err
}

// ListKeys retrieves all SSH key configurations from the database.
func (k KeyManagerDB) ListKeys() ([]ssh.KeyConfig, error) {
	var configs []ssh.KeyConfig
	err := k.db.NewSelect().
		Model(&configs).
		Scan(context.Background())
	return configs, err
}

// DeleteKey removes an SSH key configuration from the database by its name.
func (k KeyManagerDB) DeleteKey(name string) error {
	_, err := k.db.NewDelete().
		Model((*ssh.KeyConfig)(nil)).
		Where("name = ?", name).
		Exec(context.Background())
	return err
}
