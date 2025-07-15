package impl

import (
	"context"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/uptrace/bun"
)

// MachineManagerDB handles database operations for machine options.
type MachineManagerDB struct {
	db *bun.DB
}

// NewMachineManagerDB creates a new instance of MachineManagerDB.
func NewMachineManagerDB(db *bun.DB) *MachineManagerDB {
	return &MachineManagerDB{db: db}
}

// Write inserts a new machine option or updates it if it already exists.
func (m MachineManagerDB) Write(mach ssh.MachineOptions) error {
	_, err := m.db.NewInsert().
		Model(&mach).
		On("CONFLICT (name) DO UPDATE").
		Set("enable = EXCLUDED.enable").
		Set("host = EXCLUDED.host").
		Set("port = EXCLUDED.port").
		Set("user = EXCLUDED.user").
		Set("password = EXCLUDED.password").
		Set("remote_public_key = EXCLUDED.remote_public_key").
		Set("use_public_key_auth = EXCLUDED.use_public_key_auth").
		Set("updated_at = current_timestamp").
		Exec(context.Background())
	return err
}

// Delete removes a machine option from the database.
func (m MachineManagerDB) Delete(mac ssh.MachineOptions) error {
	_, err := m.db.NewDelete().
		Model(&mac).
		Where("name = ?", mac.ID).
		Exec(context.Background())
	return err
}

// List retrieves all machine options from the database.
func (m MachineManagerDB) List() ([]ssh.MachineOptions, error) {
	var machines []ssh.MachineOptions
	err := m.db.NewSelect().
		Model(&machines).
		Scan(context.Background())
	return machines, err
}

// Get retrieves a single machine option by its name.
func (m MachineManagerDB) Get(machName string) (ssh.MachineOptions, error) {
	var machine ssh.MachineOptions
	err := m.db.NewSelect().
		Model(&machine).
		Where("name = ?", machName).
		Scan(context.Background())
	return machine, err
}
