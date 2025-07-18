package lsp

import (
	"go.uber.org/zap"
	"io"
	"log"
)

type Config struct {
	stream io.ReadWriteCloser
	logger *zap.Logger
}

type Opts func(config *Config)

func ParseOpts(opts ...Opts) *Config {
	config := &Config{}
	for _, opt := range opts {
		opt(config)
	}
	return config
}

func WithStream(rwc io.ReadWriteCloser) Opts {
	return func(config *Config) {
		config.stream = rwc
	}
}

func WithZapLogger() Opts {
	return func(config *Config) {
		logger, err := zap.NewProduction()
		if err != nil {
			log.Fatalf("failed to create logger: %v", err)
		}
		config.logger = logger
	}
}

func WithLogger(logger *zap.Logger) Opts {
	return func(config *Config) {
		config.logger = logger
	}
}
