package docker

import (
	"context"
	"fmt"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
	"net"
	"path/filepath"
)

type ComposeManager interface {
}

type Service struct {
	*ComposeService
	*ContainerService
	localAddress string
}

func NewService(composeRoot string) *Service {

	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	dockerClient, err := newDockerDaemonClient()
	if err != nil {
		log.Fatal().Err(err).Msg("error initializing docker client")
	}

	containerClient := &ContainerService{daemon: dockerClient}
	composeClient := newComposeService(composeRoot, containerClient)

	localIP := getLocalAddr()
	if localIP == "" {
		localIP = "0.0.0.0"
	}
	log.Info().Str("local", localIP).Msg("local addr")

	return &Service{
		ContainerService: containerClient,
		ComposeService:   composeClient,
		localAddress:     localIP,
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

func getLocalAddr() string {
	// Docker provide a special DNS name, host.docker.internal,
	// which resolves to the internal IP address of the host machine
	host := "host.docker.internal"
	ips, err := net.LookupHost(host)
	if err != nil {
		log.Error().Str("host", host).Err(err).Msg("Failed to lookup host")
	}

	if len(ips) == 0 {
		log.Error().Str("host", host).Msg("No IP addresses found for host")
		return ""
	}

	for _, ip := range ips {
		return ip
	}
	return ""
}
