package git

import (
	"github.com/rs/zerolog/log"
	"net/http"
	"path/filepath"
)

const fileContentsFormKey = "contents"

type FileHandler struct {
	srv *Service
}

func NewFileHandler(service *Service) http.Handler {
	hand := FileHandler{srv: service}
	return hand.registerPaths()
}

func (h *FileHandler) registerPaths() http.Handler {
	subMux := http.NewServeMux()
	subMux.HandleFunc("GET /load/{filename}/{commitId}", h.LoadFileAtCommit)
	return subMux
}

func (h *FileHandler) LoadFileAtCommit(w http.ResponseWriter, r *http.Request) {
	fileName := r.PathValue("filename")
	if fileName == "" {
		http.Error(w, "Filename not provided", http.StatusBadRequest)
		return
	}
	commitID := r.PathValue("commitId")
	if commitID == "" {
		http.Error(w, "Filename not provided", http.StatusBadRequest)
		return
	}
	cleanPath := filepath.Clean(fileName)

	content, err := h.srv.LoadFileAtCommit(cleanPath, commitID)
	if err != nil {
		log.Error().Err(err).Str("path", cleanPath).Msg("Error loading file")
		http.Error(w, "Filename or commit not found", http.StatusBadRequest)
		return
	}

	_, err = w.Write([]byte(content))
	if err != nil {
		log.Error().Err(err).Msg("failed to write response")
		return
	}
}
