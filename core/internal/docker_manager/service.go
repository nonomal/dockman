package docker_manager

import (
	"github.com/RA341/dockman/internal/git"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/rs/zerolog/log"
)

type Service struct {
	Manager *ClientManager
	git     *git.Service
}

func NewService(git *git.Service, ssh *ssh.Service) *Service {
	clientManager, defaultHost := NewClientManager(ssh)
	srv := &Service{
		Manager: clientManager,
		git:     git,
	}
	if err := srv.SwitchClient(defaultHost); err != nil {
		log.Fatal().Err(err).Str("name", defaultHost).Msg("unable to switch client")
	}

	return srv
}

func (srv *Service) SwitchClient(name string) error {
	if err := srv.git.SwitchBranch(name); err != nil {
		return err
	}

	if err := srv.Manager.SwitchClient(name); err != nil {
		return err
	}

	return nil
}
