package main

import (
	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
)

func main() {
	config.LoadConfig()
	cmd.StartServer()
}
