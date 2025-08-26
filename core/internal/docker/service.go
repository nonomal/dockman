package docker

import (
	"github.com/docker/docker/client"
)

type Service struct {
	daemonAddr string
	*ComposeService
	*ContainerService
}

func NewService(
	daemonAddr string,
	dockerClient *client.Client,
	syncer Syncer,
	imageUpdateStore Store,
	name string,
	updaterUrl string,
	composeRoot string,
) *Service {
	containerClient := NewContainerService(
		dockerClient,
		imageUpdateStore,
		name,
		updaterUrl,
	)
	composeClient := NewComposeService(composeRoot, containerClient, syncer)

	return &Service{
		ContainerService: containerClient,
		ComposeService:   composeClient,
		daemonAddr:       daemonAddr,
	}
}

func (s *Service) Close() error {
	//return s.ContainerService.daemon().Close()
	// todo look into close
	return nil
}
