package main

import (
	"embed"
	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
	logger "github.com/RA341/dockman/pkg"
)

//go:embed dist
var frontendDir embed.FS

func main() {
	logger.ConsoleLogger()
	config.LoadConfig(
		config.WithUIFromEmbedded(frontendDir),
	)
	cmd.StartServer()
}
