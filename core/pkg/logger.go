package pkg

import (
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gopkg.in/natefinch/lumberjack.v2"
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

func GetFileLogger(logFile string) *lumberjack.Logger {
	return &lumberjack.Logger{
		Filename:   logFile,
		MaxSize:    10, // MB
		MaxBackups: 5,  // number of backups
		MaxAge:     30, // days
		Compress:   true,
	}
}
