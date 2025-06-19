package main

import (
	"github.com/RA341/dockman/cmd"
	logger "github.com/RA341/dockman/pkg"
)

func main() {
	logger.ConsoleLogger()
	config := cmd.LoadConfig()

	cmd.StartServer(
		cmd.WithConfig(config),
		cmd.WithPort(8866),
	)
}
