package docker

import (
	"context"
	"fmt"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
	"path/filepath"
)

type ComposeManager interface {
}

type Service struct {
	*ComposeService
	*ContainerService
}

func NewService(composeRoot string) *Service {
	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	dockerClient, err := newDockerDaemonClient()
	if err != nil {
		log.Fatal().Err(err).Msg("error initializing docker client")
	}

	composeClient := newComposeService(composeRoot, dockerClient)
	containerClient := &ContainerService{daemon: dockerClient}

	return &Service{
		ContainerService: containerClient,
		ComposeService:   composeClient,
	}
}

func newDockerDaemonClient() (*client.Client, error) {
	dockerClient, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to docker deamon: %w", err)
	}

	_, err = dockerClient.Ping(context.Background())
	if err != nil {
		return nil, fmt.Errorf("unable to ping deamon: %w", err)
	}

	return dockerClient, err
}

func (s *Service) Close() error {
	return s.ContainerService.daemon.Close()
}
