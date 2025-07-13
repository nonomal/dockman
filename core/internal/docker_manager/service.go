package docker_manager

import (
	"fmt"
	"github.com/RA341/dockman/internal/docker"
	"github.com/RA341/dockman/internal/git"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
	"path/filepath"
	"sync"
)

type Service struct {
	manager     *ClientManager
	git         *git.Service
	composeRoot string

	mu           sync.RWMutex
	activeClient *docker.Service
}

func NewService(git *git.Service, ssh *ssh.Service, composeRoot string) *Service {
	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	clientManager, defaultHost := NewClientManager(ssh)
	srv := &Service{
		composeRoot: composeRoot,
		git:         git,
		manager:     clientManager,
	}
	if err := srv.SwitchClient(defaultHost); err != nil {
		log.Fatal().Err(err).Str("name", defaultHost).Msg("unable to switch client")
	}
	return srv
}

func (srv *Service) GetServiceInstance() *docker.Service {
	srv.mu.RLock()
	defer srv.mu.RUnlock()
	return srv.activeClient // Always ready, no creation needed
}

func (srv *Service) SwitchClient(name string) error {
	oldClient := srv.manager.GetActiveClient()

	wg := errgroup.Group{}
	wg.Go(func() error {
		if err := srv.git.SwitchBranch(name); err != nil {
			return fmt.Errorf("unable to switch branch :%w", err)
		}
		return nil
	})

	wg.Go(func() error {
		if err := srv.manager.SwitchClient(name); err != nil {
			return fmt.Errorf("unable to switch docker client :%w", err)
		}
		return nil
	})

	if err := wg.Wait(); err != nil {
		// back to old client
		_ = srv.git.SwitchBranch(oldClient)
		_ = srv.manager.SwitchClient(oldClient)
		return err
	}

	srv.mu.Lock()
	defer srv.mu.Unlock()

	if srv.activeClient != nil {
		// TODO: Maybe Add cleanup docker.Service
		// srv.activeClient.Close()
	}

	mach := srv.manager.GetMachine()
	syncer := docker.NewSFTPSyncer(mach.sftpClient, srv.composeRoot)
	srv.activeClient = docker.NewService(
		srv.composeRoot,
		mach.dockerClient,
		syncer,
	)

	return nil
}
