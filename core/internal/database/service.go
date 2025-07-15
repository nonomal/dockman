package database

import (
	"database/sql"
	"github.com/rs/zerolog/log"
)

type Service struct {
	sqlConn *sql.DB
}

func NewService() *Service {
	_, sqlConn, err := connect()
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
		return nil
	}

	return &Service{sqlConn: sqlConn}
}

func (s *Service) Close() error {
	return s.sqlConn.Close()
}
