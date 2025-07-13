package main

import (
	"github.com/RA341/dockman/internal/lsp"
	"go.uber.org/zap"
	"io"
	"log"
	"os"
)

// a simple struct that combines a reader and a writer
type stdioReadWriteCloser struct {
	io.Reader
	io.Writer
}

func (s *stdioReadWriteCloser) Close() error { return nil }

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("failed to create logger: %v", err)
	}

	stream := &stdioReadWriteCloser{
		Reader: os.Stdin,
		Writer: os.Stdout,
	}

	if err = lsp.StartLSP(
		lsp.WithStream(stream),
		lsp.WithLogger(logger),
	); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}
