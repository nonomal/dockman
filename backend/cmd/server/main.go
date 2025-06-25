package main

import (
	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
	logger "github.com/RA341/dockman/pkg"
)

func main() {
	logger.ConsoleLogger()
	config.LoadConfig()
	cmd.StartServer()
}
