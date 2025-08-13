package files

import (
	"fmt"
	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"
)

// NewWebSocketHandler returns an http.Handler that upgrades the connection
func NewWebSocketHandler(srv *Service, up websocket.Upgrader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Debug().Msg("starting fuzzy search ws")

		conn, err := up.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to upgrade connection: %v", err), http.StatusInternalServerError)
			return
		}
		// Ensure connection is closed when function exits
		defer fileutil.Close(conn)

		handler := WSHandler{
			conn:        conn,
			srv:         srv,
			receiveChan: make(chan []byte, 256), // buffered channel for incoming messages
			done:        make(chan struct{}),
		}

		handler.Start()
	}
}

type WSHandler struct {
	receiveChan chan []byte
	done        chan struct{}

	conn *websocket.Conn
	srv  *Service
}

func (s *WSHandler) Start() {
	log.Debug().Msg("WebSocket handler started")

	go s.readMessages()
	go s.handleMessages()

	// Wait for done signal or connection close
	<-s.done
	log.Debug().Msg("WebSocket handler stopped")
}

// readMessages reads messages from the WebSocket connection
func (s *WSHandler) readMessages() {
	defer close(s.receiveChan)

	for {
		select {
		case <-s.done:
			return
		default:
			// Set read deadline to prevent hanging
			_ = s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			_, message, err := s.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Error().Err(err).Msg("WebSocket read error")
				}
				s.close()
				return
			}

			select {
			case s.receiveChan <- message:
			case <-s.done:
				return
			}
		}
	}
}

// handleMessages processes incoming messages
func (s *WSHandler) handleMessages() {
	for {
		select {
		case message, ok := <-s.receiveChan:
			if !ok {
				// Channel closed, stop handling
				s.close()
				return
			}

			if err := s.processMessage(message); err != nil {
				log.Error().Err(err).Msg("Error processing message")

				err = s.sendError(fmt.Sprintf("Error processing message: %v", err))
				if err != nil {
					log.Warn().Err(err).Msg("Error sending message")
					continue
				}
			}

		case <-s.done:
			return
		}
	}
}

// processMessage handles individual messages
func (s *WSHandler) processMessage(message []byte) error {
	query := string(message)
	log.Debug().Str("message", query).Msg("Processing WebSocket message")
	return s.handleSearch(query)
}

// handleSearch performs fuzzy search and sends results
func (s *WSHandler) handleSearch(query string) error {
	if query == "" {
		return s.sendResults([]interface{}{}) // Send empty results for empty query
	}

	// Perform the search using your service
	results, err := s.srv.FuzzySearch(query)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	return s.sendResults(results)
}

// sendResults sends search results to the client
func (s *WSHandler) sendResults(results interface{}) error {
	response := map[string]interface{}{
		"type":      "results",
		"data":      results,
		"timestamp": time.Now().Unix(),
	}

	return s.sendJSON(response)
}

// sendError sends an error message to the client
func (s *WSHandler) sendError(message string) error {
	response := map[string]interface{}{
		"type":      "error",
		"message":   message,
		"timestamp": time.Now().Unix(),
	}

	return s.sendJSON(response)
}

// sendJSON sends a JSON message to the client
func (s *WSHandler) sendJSON(data interface{}) error {
	_ = s.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return s.conn.WriteJSON(data)
}

// close gracefully closes the WebSocket connection
func (s *WSHandler) close() {
	select {
	case <-s.done:
		return // Already closed
	default:
		close(s.done)
	}
}
