package host_manager

import (
	"github.com/RA341/dockman/internal/git"
	"github.com/rs/zerolog/log"
	"os"
)

type Service struct {
	Manager *ClientManager
	config  *ConfigManager
	git     *git.Service
}

func NewService(git *git.Service) *Service {
	basedir := "config"
	if err := os.MkdirAll(basedir, os.ModePerm); err != nil {
		log.Fatal().Err(err).Msg("unable to create config directory")
	}

	// ssh dir is at config/ssh we store load host config from config/
	configManager, err := NewConfigManager(basedir)
	if err != nil {
		log.Fatal().Err(err).Msg("unable load host config")
	}

	man, defaultHost := NewClientManager(basedir, configManager)

	srv := &Service{
		Manager: man,
		config:  configManager,
		git:     git,
	}
	if err = srv.SwitchClient(defaultHost); err != nil {
		log.Fatal().Err(err).Str("name", defaultHost).Msg("unable to switch client")
	}

	return srv
}

func (srv *Service) SwitchClient(name string) error {
	if err := srv.Manager.SwitchClient(name); err != nil {
		return err
	}

	if err := srv.git.SwitchBranch(name); err != nil {
		return err
	}

	return nil
}
