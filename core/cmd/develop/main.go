package main

import (
	"os"

	"github.com/RA341/dockman/cmd"
	"github.com/RA341/dockman/internal/config"
	"github.com/RA341/dockman/pkg/argos"
)

// useful for developing sets some default options
func main() {
	prefixer := argos.Prefixer(config.EnvPrefix)

	_ = os.Setenv(prefixer("LOG_LEVEL"), "10")
	_ = os.Setenv(prefixer("LOG_VERBOSE"), "true")
	_ = os.Setenv(prefixer("CONFIG"), "./config")
	_ = os.Setenv(prefixer("COMPOSE_ROOT"), "./compose")

	cmd.StartServer()
}
