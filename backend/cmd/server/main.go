package main

import (
	"github.com/RA341/dockman/cmd"
	logger "github.com/RA341/dockman/pkg"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
)

func main() {
	logger.ConsoleLogger()
	cmd.StartServer(
		cmd.WithUI(setupFrontend()),
		cmd.WithPort(8866),
	)
}

func setupFrontend() http.Handler {
	uipath := *cmd.LoadArgs()
	log.Debug().Str("path", uipath).Msg("Loading frontend path from args")

	root, err := os.OpenRoot(uipath)
	if err != nil {
		log.Fatal().Err(err).Str("path", uipath).Msg("failed to open root")
	}

	return http.FileServer(http.FS(root.FS()))
}
