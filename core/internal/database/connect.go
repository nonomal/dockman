package database

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"path/filepath"
	"reflect"
)

const dockmanDB = "dockman.db"

func connect(basepath string) (*bun.DB, *sql.DB, error) {
	dbpath := filepath.Join(basepath, dockmanDB)
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

	err = autoCreateTables(db,
		(*ssh.MachineOptions)(nil),
		(*ssh.KeyConfig)(nil),
	)
	if err != nil {
		return nil, nil, err
	}

	if err = autoMigrate(db); err != nil {
		return nil, nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Info().Str("path", dbpath).Msg("Connected to database")
	return db, sqldb, nil
}

// autoCreateTables creates database tables for all models in list.
func autoCreateTables(db *bun.DB, models ...interface{}) error {
	for _, model := range models {
		// The `IfNotExists()` option is crucial to prevent errors on subsequent runs.
		_, err := db.NewCreateTable().
			Model(model).
			IfNotExists().
			Exec(context.Background())

		if err != nil {
			// reflection to get the struct name for a more helpful error message.
			modelName := reflect.TypeOf(model).Elem().Name()
			return fmt.Errorf("could not create table for model %s: %w", modelName, err)
		}
	}

	return nil
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
