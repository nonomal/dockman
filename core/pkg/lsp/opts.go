package lsp

import (
	"go.uber.org/zap"
	"io"
	"log"
)

type LspConfig struct {
	stream io.ReadWriteCloser
	logger *zap.Logger
}

type LspOpts func(config *LspConfig)

func ParseOpts(opts ...LspOpts) *LspConfig {
	config := &LspConfig{}
	for _, opt := range opts {
		opt(config)
	}
	return config
}

func WithStream(rwc io.ReadWriteCloser) LspOpts {
	return func(config *LspConfig) {
		config.stream = rwc
	}
}

func WithZapLogger() LspOpts {
	return func(config *LspConfig) {
		logger, err := zap.NewProduction()
		if err != nil {
			log.Fatalf("failed to create logger: %v", err)
		}
		config.logger = logger
	}
}

func WithLogger(logger *zap.Logger) LspOpts {
	return func(config *LspConfig) {
		config.logger = logger
	}
}
