package lsp

import (
	"context"
	"go.lsp.dev/jsonrpc2"
	"go.lsp.dev/protocol"
	"log"
)

// StartLSP starts an LSP session on the given stream.
// It blocks until the client disconnects.
func StartLSP(opts ...LspOpts) error {
	config := ParseOpts(opts...)

	jsonStream := jsonrpc2.NewStream(config.stream)

	s := NewServer()
	ctx, conn, _ := protocol.NewServer(context.Background(), s, jsonStream, config.logger)
	s.conn = conn

	config.logger.Info("Starting lsp server")
	<-ctx.Done()
	config.logger.Info("Starting lsp server")

	log.Println("LSP Server Connected and Listening.")
	return nil
}
