package main

import (
	"embed"
	"github.com/RA341/dockman/cmd"
	logger "github.com/RA341/dockman/pkg"
)

//go:embed dist
var frontendDir embed.FS

func main() {
	logger.ConsoleLogger()
	config := cmd.LoadConfig()

	cmd.StartServer(
		cmd.WithConfig(config), // start with config loaded from  args/envs
		cmd.WithUI(cmd.LoadEmbeddedUI(frontendDir)),
		cmd.WithPort(8877),
	)
}
