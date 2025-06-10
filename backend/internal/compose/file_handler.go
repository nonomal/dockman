package compose

import (
	"github.com/rs/zerolog/log"
	"net/http"
	"path/filepath"
)

const fileContentsFormKey = "contents"

type FileHandler struct {
	srv *Service
}

func NewFileHandler(service *Service) *FileHandler {
	return &FileHandler{srv: service}
}

func (h *FileHandler) RegisterHandler() (string, http.Handler) {
	basePath := "/api/file"
	subMux := http.NewServeMux()

	subMux.HandleFunc("POST /save", h.SaveFile)
	subMux.HandleFunc("GET /load/{filename}", h.LoadFile)
	return basePath + "/", http.StripPrefix(basePath, subMux)
}

func (h *FileHandler) SaveFile(w http.ResponseWriter, r *http.Request) {
	// 10 MB is the maximum upload size
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		log.Fatal().Err(err).Msg("Error parsing multipart form")
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	file, meta, err := r.FormFile(fileContentsFormKey)
	if err != nil {
		log.Error().Err(err).Msg("Error retrieving file from form")
		http.Error(w, "Error retrieving file from form", http.StatusBadRequest)
		return
	}
	defer closeFile(file)

	err = h.srv.Save(meta.Filename, file)
	if err != nil {
		log.Error().Err(err).Msg("Error saving file")
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	log.Info().Str("filename", meta.Filename).Msg("Successfully saved File")
}

func (h *FileHandler) LoadFile(w http.ResponseWriter, r *http.Request) {
	fileName := r.PathValue("filename")
	if fileName == "" {
		http.Error(w, "Filename not provided", http.StatusBadRequest)
		return
	}
	cleanPath := filepath.Clean(fileName)

	fullPath, err := h.srv.Load(cleanPath)
	if err != nil {
		log.Error().Err(err).Msg("Error loading file")
		http.Error(w, "Filename not found", http.StatusBadRequest)
		return
	}

	http.ServeFile(w, r, fullPath)
}
