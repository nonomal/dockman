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

type LspOpts func(config *Config)

func ParseOpts(opts ...LspOpts) *Config {
	config := &Config{}
	for _, opt := range opts {
		opt(config)
	}
	return config
}

func WithStream(rwc io.ReadWriteCloser) LspOpts {
	return func(config *Config) {
		config.stream = rwc
	}
}

func WithZapLogger() LspOpts {
	return func(config *Config) {
		logger, err := zap.NewProduction()
		if err != nil {
			log.Fatalf("failed to create logger: %v", err)
		}
		config.logger = logger
	}
}

func WithLogger(logger *zap.Logger) LspOpts {
	return func(config *Config) {
		config.logger = logger
	}
}
