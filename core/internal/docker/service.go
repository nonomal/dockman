package docker

import (
	"github.com/docker/docker/client"
)

type Service struct {
	*ComposeService
	*ContainerService
}

func NewService(composeRoot string, dockerClient *client.Client, syncer Syncer) *Service {
	containerClient := NewContainerService(dockerClient)
	composeClient := NewComposeService(composeRoot, containerClient, syncer)

	return &Service{
		ContainerService: containerClient,
		ComposeService:   composeClient,
	}
}

func (s *Service) Close() error {
	//return s.ContainerService.daemon().Close()
	// todo look into close
	return nil
}
