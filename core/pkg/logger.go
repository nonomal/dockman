package pkg

import (
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"os"
)

func getConsoleWriter() zerolog.ConsoleWriter {
	return zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: "2006-01-02 15:04:05",
	}
}

func getBaseLogger(verboseLogsEnv string) zerolog.Logger {
	env, ok := os.LookupEnv(verboseLogsEnv)
	if !ok || env == "false" {
		return log.Level(zerolog.InfoLevel).With().Logger().Output(getConsoleWriter())
	}

	return log.With().Caller().Logger().Output(getConsoleWriter())
}

func ConsoleLogger(verboseLogsEnv string) {
	log.Logger = getBaseLogger(verboseLogsEnv)
}
