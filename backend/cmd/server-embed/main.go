package main

import (
	"embed"
	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
)

//go:embed dist
var frontendDir embed.FS

func main() {
	config.LoadConfig(
		config.WithUIFromEmbedded(frontendDir),
	)
	cmd.StartServer()
}
