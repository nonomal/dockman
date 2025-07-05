package lsp

import (
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
)

var DefaultUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // WARNING: In production, check the origin!
}

// WebSocketHandler returns an http.Handler that upgrades the connection
// to a WebSocket and starts an LSP session.
func WebSocketHandler(up websocket.Upgrader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := up.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to start lsp server: %v", err), http.StatusInternalServerError)
			return
		}

		stream := &WebSocketStream{conn: conn}
		if err = StartLSP(WithStream(stream), WithZapLogger()); err != nil {
			http.Error(w, fmt.Sprintf("Failed to start lsp server: %v", err), http.StatusInternalServerError)
			return
		}
	}
}

// WebSocketStream wraps a websocket connection to implement io.ReadWriteCloser
// The websocket.Conn satisfies the io.ReadWriteCloser interface,
// But we need to wrap it to handle message types
//
// Why: When the jsonrpc2 library calls stream.Read(),
// it would be calling the low-level websocket.Conn.Read() method
//
// This method is not guaranteed to return a complete WebSocket message. It might just return the first few bytes of the message frame.
// This would confuse the parser, which is expecting a full header and JSON body.
type WebSocketStream struct {
	conn *websocket.Conn
}

func (s *WebSocketStream) Read(p []byte) (n int, err error) {
	_, r, err := s.conn.NextReader()
	if err != nil {
		return 0, err
	}
	return r.Read(p)
}

func (s *WebSocketStream) Write(p []byte) (n int, err error) {
	err = s.conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (s *WebSocketStream) Close() error {
	return s.conn.Close()
}
