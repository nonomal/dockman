package main

import (
	"embed"
	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
	"io/fs"
	"log"
)

//go:embed dist
var frontendDir embed.FS

func main() {
	log.Printf("Loading frontend from embedded FS")
	subFS, err := fs.Sub(frontendDir, "dist")
	if err != nil {
		log.Fatal("Error loading frontend directory", err)
	}

	cmd.StartServer(
		config.WithUIFS(subFS),
	)
}
