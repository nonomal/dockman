package database

import (
	"database/sql"
	"github.com/RA341/dockman/internal/database/impl"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/rs/zerolog/log"
)

type Service struct {
	sqlConn   *sql.DB
	SshKeyDB  ssh.KeyManager
	MachineDB ssh.MachineManager
}

func NewService(basepath string) *Service {
	bunDB, sqlConn, err := connect(basepath)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
		return nil
	}

	keyman := impl.NewKeyManagerDB(bunDB)
	macMan := impl.NewMachineManagerDB(bunDB)

	return &Service{
		sqlConn:   sqlConn,
		SshKeyDB:  keyman,
		MachineDB: macMan,
	}
}

func (s *Service) Close() error {
	return s.sqlConn.Close()
}
