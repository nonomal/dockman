package database

import (
	"database/sql"
	"fmt"
	"github.com/RA341/dockman/internal/config"
	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"path/filepath"
)

const dockmanDB = "dockman.db"

func connect() (*bun.DB, *sql.DB, error) {
	dbpath := filepath.Join(config.C.ConfigDir, dockmanDB)
	if dbpath == "" {
		log.Fatal().Msgf("db_path is empty")
	}

	connectionStr := dbpath + "?_journal_mode=WAL&_busy_timeout=5000"

	sqldb, err := sql.Open(sqliteshim.ShimName, connectionStr)
	if err != nil {
		return nil, nil, err
	}

	db := bun.NewDB(sqldb, sqlitedialect.New())

	// todo verbose logs
	//if config.IsDebugMode() {
	//}
	//conf := &gorm.Config{
	//	PrepareStmt: true,
	//}

	if err = autoMigrate(db); err != nil {
		return nil, nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Info().Str("path", dbpath).Msg("Connected to database")
	return db, sqldb, nil
}

func autoMigrate(db *bun.DB) error {
	// todo
	//migrator, err := migrate.NewAutoMigrator(db)
	//if err != nil {
	//	return fmt.Errorf("unable to create auto migrator: %w", err)
	//}

	// Add models to migrate
	//migrator = migrator.WithModel((*User)(nil), (*Post)(nil))
	//
	//// Run auto migration
	//if err := migrator.Migrate(ctx); err != nil {
	//	log.Fatal(err)
	//}

	return nil
}
