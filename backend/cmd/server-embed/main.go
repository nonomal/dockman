package main

import (
	"embed"
	"github.com/RA341/dockman/cmd"
	"github.com/rs/zerolog/log"
	"io/fs"
	"net/http"
)

//go:embed dist
var frontendDir embed.FS

func main() {
	config := cmd.LoadConfig()
	cmd.StartServer(
		cmd.WithConfig(config), // start with config loaded from  args/envs
		cmd.WithUI(setupFrontend()),
		cmd.WithPort(8877),
	)
}

func setupFrontend() http.Handler {
	log.Debug().Msg("Loading frontend from embedded FS")

	subFS, err := fs.Sub(frontendDir, "dist")
	if err != nil {
		log.Fatal().Err(err).Msg("failed to setup frontend fs")
	}

	return http.FileServer(http.FS(subFS))
}
