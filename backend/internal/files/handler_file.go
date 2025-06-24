package files

import (
	b64 "encoding/base64"
	"github.com/RA341/dockman/pkg"
	"github.com/rs/zerolog/log"
	"net/http"
	"path/filepath"
)

const fileContentsFormKey = "contents"

type FileHandler struct {
	srv *Service
}

func NewFileHandler(service *Service) http.Handler {
	hand := &FileHandler{srv: service}
	return hand.register()
}

func (h *FileHandler) register() http.Handler {
	subMux := http.NewServeMux()
	subMux.HandleFunc("POST /save", h.SaveFile)
	subMux.HandleFunc("GET /load/{filename}", h.LoadFile)

	return subMux
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
	defer pkg.CloseFile(file)

	decodedFileName, err := b64.StdEncoding.DecodeString(meta.Filename)
	if err != nil {
		http.Error(w, "Error converting file name from base64", http.StatusBadRequest)
		return
	}

	err = h.srv.Save(string(decodedFileName), file)
	if err != nil {
		log.Error().Err(err).Msg("Error saving file")
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	//log.Debug().Str("filename", meta.Filename).Msg("Successfully saved File")
}

func (h *FileHandler) LoadFile(w http.ResponseWriter, r *http.Request) {
	fileName := r.PathValue("filename")
	if fileName == "" {
		http.Error(w, "Filename not provided", http.StatusBadRequest)
		return
	}
	cleanPath := filepath.Clean(fileName)

	fullPath, err := h.srv.LoadFilePath(cleanPath)
	if err != nil {
		log.Error().Err(err).Str("path", cleanPath).Msg("Error loading file")
		http.Error(w, "Filename not found", http.StatusBadRequest)
		return
	}

	http.ServeFile(w, r, fullPath)
}
