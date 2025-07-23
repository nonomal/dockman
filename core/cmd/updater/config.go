package main

import (
	"github.com/RA341/dockman/pkg/argos"
	"github.com/rs/zerolog/log"
)

func init() {
	Load()
}

const envPrefix = "DOCKMAN_UPDATER"

type UpdaterConfig struct {
	ComposeRoot  string `config:"flag=cr,env=COMPOSE_ROOT,default=/stacks,usage=Root directory for compose files must be same as dockman"`
	UpdaterImage string `config:"flag=image,env=IMAGE,default=,usage=Image to monitor generally "`
	UpdaterKey   string `config:"flag=authkey,env=AUTHKEY,default=superSecretAuth,usage=Security key to update,hide=true"`
}

var conf UpdaterConfig

func Load() {
	if err := argos.Scan(&conf, envPrefix); err != nil {
		log.Fatal().Err(err).Msg("unable to parse config struct")
		return
	}

	if conf.UpdaterImage == "" {
		log.Fatal().Msg("no updater image specified")
		return

	}

	argos.PrettyPrint(&conf, envPrefix)
}
