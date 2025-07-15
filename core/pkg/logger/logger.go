package logger

import (
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"os"
	"strings"
)

func getConsoleWriter() zerolog.ConsoleWriter {
	return zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: "2006-01-02 15:04:05",
	}
}

func getBaseLogger(verboseLogs bool) zerolog.Logger {
	if verboseLogs {
		return log.With().Caller().Logger().Output(getConsoleWriter())
	}
	return log.Level(zerolog.InfoLevel).With().Logger().Output(getConsoleWriter())
}

func DefaultLogger() {
	log.Logger = getBaseLogger(true)
}

func ConsoleLogger(verboseLogsEnv string) {
	env, found := os.LookupEnv(verboseLogsEnv)
	verboseLogs := found && strings.ToLower(env) == "true"

	log.Logger = getBaseLogger(verboseLogs)
}

func ConsoleLoggerForTest() {
	log.Logger = getBaseLogger(true)
}
