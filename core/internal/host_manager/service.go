package host_manager

import (
	"github.com/rs/zerolog/log"
	"os"
)

type Service struct {
	Manager *ClientManager
	config  *ConfigManager
}

func NewService() *Service {
	basedir := "config"
	if err := os.MkdirAll(basedir, os.ModePerm); err != nil {
		log.Fatal().Err(err).Msg("unable to create config directory")
	}

	// ssh dir is at config/ssh we store load host config from config/
	configManager, err := NewConfigManager(basedir)
	if err != nil {
		log.Fatal().Err(err).Msg("unable load host config")
	}

	man := NewClientManager(basedir, configManager)

	return &Service{
		Manager: man,
		config:  configManager,
	}
}
