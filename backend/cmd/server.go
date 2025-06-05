package cmd

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dist
var frontendDir embed.FS

func StartServer() {
	srv := getFrontendDir()
	err := http.ListenAndServe(":8080", srv)
	if err != nil {
		panic(err)
	}
}

func getFrontendDir() http.Handler {
	subFS, err := fs.Sub(frontendDir, "web")
	if err != nil {
		panic(err)
	}
	return http.FileServer(http.FS(subFS))
}
