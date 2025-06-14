package docker

import (
	"context"
	"fmt"
	"github.com/compose-spec/compose-go/v2/cli"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/flags"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
	"path/filepath"
	"reflect"
	"strings"
)

type ComposeManager interface {
}

type Service struct {
	composeRoot string
	daemon      *client.Client
	compose     api.Service
}

func NewService(composeRoot string) *Service {
	if !filepath.IsAbs(composeRoot) {
		log.Fatal().Str("path", composeRoot).Msg("composeRoot must be an absolute path")
	}

	dockerClient, err := newDockerDaemonClient()
	if err != nil {
		log.Fatal().Err(err).Msg("error initializing docker client")
	}

	composeClient, err := createComposeClient()
	if err != nil {
		log.Fatal().Err(err).Msg("error initializing docker compose client")
	}

	return &Service{
		composeRoot: composeRoot,
		daemon:      dockerClient,
		compose:     composeClient,
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

func createComposeClient() (api.Service, error) {
	dockerComposeCli, err := command.NewDockerCli()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create a cli client to docker for compose")
	}

	// thanks portainer team !!
	// https://github.com/portainer/portainer/blob/develop/pkg/libstack/compose/composeplugin.go
	// Magic line to fix error:
	// Failed to initialize: unable to resolve docker endpoint: no context store initialized
	dockerContext := "default"
	opts := &flags.ClientOptions{Context: dockerContext, LogLevel: "error"}
	err = dockerComposeCli.Initialize(opts)
	if err != nil {
		return nil, err
	}

	return compose.NewComposeService(dockerComposeCli), nil
}

func (s *Service) Up(ctx context.Context, filename string) error {
	return s.withProject(ctx, filename, s.startStack)
}

func (s *Service) Down(ctx context.Context, filename string) error {
	return s.withProject(ctx, filename, s.downStack)
}

func (s *Service) Stop(ctx context.Context, filename string) error {
	return s.withProject(ctx, filename, s.stopStack)
}

func (s *Service) Pull(ctx context.Context, filename string) error {
	return s.withProject(ctx, filename, s.pullStack)
}

func (s *Service) Update(ctx context.Context, filename string) error {
	return s.withProject(ctx, filename, func(ctx context.Context, project *types.Project) error {
		beforeImages, err := s.getProjectImageDigests(ctx, project)
		if err != nil {
			return fmt.Errorf("failed to get image info before pull: %w", err)
		}

		if err = s.pullStack(ctx, project); err != nil {
			return err
		}

		afterImages, err := s.getProjectImageDigests(ctx, project)
		if err != nil {
			return fmt.Errorf("failed to get image info after pull: %w", err)
		}

		// Compare digests
		if reflect.DeepEqual(beforeImages, afterImages) {
			log.Info().Msg("No new images were downloaded")
			return nil
		}

		log.Info().Str("stack", project.Name).Msgf("New images were downloaded, updating stack")
		if err = s.downStack(ctx, project); err != nil {
			return err
		}

		if err = s.startStack(ctx, project); err != nil {
			return err
		}

		return nil
	})
}

func (s *Service) startStack(ctx context.Context, project *types.Project) error {
	// todo maybe add config flags
	var opts api.UpOptions
	opts.Create.Recreate = api.RecreateForce
	opts.Create.RemoveOrphans = true
	opts.Start.OnExit = api.CascadeStop

	if err := s.compose.Build(ctx, project, api.BuildOptions{}); err != nil {
		return fmt.Errorf("compose build operation failed: %w", err)
	}

	if err := s.compose.Up(ctx, project, opts); err != nil {
		return fmt.Errorf("compose up operation failed: %w", err)
	}

	return nil
}

func (s *Service) downStack(ctx context.Context, project *types.Project) error {
	if err := s.compose.Down(ctx, project.Name, api.DownOptions{}); err != nil {
		return fmt.Errorf("compose up operation failed: %w", err)
	}
	return nil
}

func (s *Service) stopStack(ctx context.Context, project *types.Project) error {
	if err := s.compose.Stop(ctx, project.Name, api.StopOptions{}); err != nil {
		return fmt.Errorf("compose up operation failed: %w", err)
	}

	return nil
}

func (s *Service) pullStack(ctx context.Context, project *types.Project) error {
	if err := s.compose.Pull(ctx, project, api.PullOptions{}); err != nil {
		return fmt.Errorf("compose pull operation failed: %w", err)
	}
	return nil
}

func (s *Service) ListStack(ctx context.Context, filename string) ([]container.Summary, error) {
	var result []container.Summary

	err := s.withProject(ctx, filename, func(ctx context.Context, project *types.Project) error {
		containerFilters := filters.NewArgs()
		projectLabel := fmt.Sprintf("%s=%s", api.ProjectLabel, project.Name)
		containerFilters.Add("label", projectLabel)

		var err error
		result, err = s.daemon.ContainerList(ctx, container.ListOptions{
			All:     true, // all containers (running and stopped).
			Filters: containerFilters,
		})
		if err != nil {
			return fmt.Errorf("failed to list containers for project '%s': %w", project.Name, err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *Service) getProjectImageDigests(ctx context.Context, project *types.Project) (map[string]string, error) {
	digests := make(map[string]string)

	for serviceName, service := range project.Services {
		if service.Image == "" {
			continue
		}

		imageInspect, err := s.daemon.ImageInspect(ctx, service.Image)
		if err != nil {
			// Image might not exist locally yet
			digests[serviceName] = ""
			continue
		}

		// Use RepoDigests if available, otherwise use the image ID
		if len(imageInspect.RepoDigests) > 0 {
			digests[serviceName] = imageInspect.RepoDigests[0]
		} else {
			digests[serviceName] = imageInspect.ID
		}
	}

	return digests, nil
}

func (s *Service) withProject(ctx context.Context, filename string, execFn func(ctx context.Context, project *types.Project) error) error {
	options, err := cli.NewProjectOptions(
		[]string{filename},
		cli.WithOsEnv,
		cli.WithDotEnv,
		cli.WithWorkingDirectory(s.composeRoot),
		cli.WithDefaultProfiles(),
	)
	if err != nil {
		return fmt.Errorf("failed to create new project: %w", err)
	}

	project, err := options.LoadProject(ctx)
	if err != nil {
		return fmt.Errorf("failed to load project: %w", err)
	}

	addServiceLabels(project)
	// Ensure service environment variables
	if p, err := project.WithServicesEnvironmentResolved(true); err == nil {
		project = p
	} else {
		return fmt.Errorf("failed to resolve services environment: %w", err)
	}

	project = project.WithoutUnnecessaryResources()

	return execFn(ctx, project)
}

func (s *Service) Close() error {
	return s.daemon.Close()
}

func addServiceLabels(project *types.Project) {
	for i, s := range project.Services {
		s.CustomLabels = map[string]string{
			api.ProjectLabel:     project.Name,
			api.ServiceLabel:     s.Name,
			api.VersionLabel:     api.ComposeVersion,
			api.WorkingDirLabel:  "/",
			api.ConfigFilesLabel: strings.Join(project.ComposeFiles, ","),
			api.OneoffLabel:      "False", // default, will be overridden by `run` command
		}

		project.Services[i] = s
	}
}
