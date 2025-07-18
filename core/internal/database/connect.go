package database

import (
	"fmt"
	"github.com/RA341/dockman/internal/info"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"path/filepath"
)

const dockmanDB = "dockman.db"

func connect(basepath string) (*gorm.DB, error) {
	basepath = filepath.Join(basepath, dockmanDB)
	dbpath, err := filepath.Abs(basepath)
	if err != nil {
		return nil, fmt.Errorf("unable to get abs path of %s: %w", basepath, err)
	}

	// Configure SQLite to use WAL mode
	connectionStr := dbpath + "?_journal_mode=WAL&_busy_timeout=5000"
	conn := sqlite.Open(connectionStr)
	conf := &gorm.Config{
		PrepareStmt: true,
	}
	if info.IsDev() {
		conf = &gorm.Config{
			//Logger:      logger.Default.LogMode(logger.Info),
			PrepareStmt: true,
		}
	}

	db, err := gorm.Open(conn, conf)
	if err != nil {
		return nil, err
	}

	if err = db.AutoMigrate(&ssh.MachineOptions{}, &ssh.KeyConfig{}); err != nil {
		return nil, fmt.Errorf("failed to auto migrate DB: %w", err)
	}

	log.Info().Str("path", dbpath).Msg("Connected to database")
	return db, nil
}
