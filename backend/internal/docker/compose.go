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

type ComposeService struct {
	composeRoot string
	daemon      *client.Client
}

func newComposeService(composeRoot string, client *client.Client) *ComposeService {
	return &ComposeService{
		composeRoot: composeRoot,
		daemon:      client,
	}
}

func (s *ComposeService) Up(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		return s.startStack(ctx, cli, project)
	})
}

func (s *ComposeService) Down(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		return s.downStack(ctx, cli, project)
	})
}

func (s *ComposeService) Stop(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		return s.stopStack(ctx, cli, project)
	})
}

func (s *ComposeService) Pull(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		return s.pullStack(ctx, cli, project)
	})
}

func (s *ComposeService) Restart(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		return s.restartStack(ctx, cli, project)
	})
}

func (s *ComposeService) Update(ctx context.Context, filename string, opts ...Opts) error {
	return s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		beforeImages, err := s.getProjectImageDigests(ctx, project)
		if err != nil {
			return fmt.Errorf("failed to get image info before pull: %w", err)
		}

		if err = s.pullStack(ctx, cli, project); err != nil {
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
		if err = s.downStack(ctx, cli, project); err != nil {
			return err
		}

		if err = s.startStack(ctx, cli, project); err != nil {
			return err
		}

		return nil
	})
}

func (s *ComposeService) StatStack(ctx context.Context, filename string, opts ...Opts) ([]api.ContainerSummary, error) {
	var result []api.ContainerSummary
	err := s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		ps, err := cli.Ps(ctx, project.Name, api.PsOptions{})
		if err != nil {
			return err
		}

		result = ps
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, err
}

func (s *ComposeService) ListStack(ctx context.Context, filename string, opts ...Opts) ([]container.Summary, error) {
	var result []container.Summary
	err := s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
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

func (s *ComposeService) startStack(ctx context.Context, composeCli api.Service, project *types.Project) error {
	var opts api.UpOptions
	opts.Create.Recreate = api.RecreateForce
	opts.Create.RemoveOrphans = true
	opts.Start.OnExit = api.CascadeStop

	if err := composeCli.Build(ctx, project, api.BuildOptions{}); err != nil {
		return fmt.Errorf("compose build operation failed: %w", err)
	}

	if err := composeCli.Up(ctx, project, opts); err != nil {
		return fmt.Errorf("compose up operation failed: %w", err)
	}

	return nil
}

func (s *ComposeService) downStack(ctx context.Context, cli api.Service, project *types.Project) error {
	if err := cli.Down(ctx, project.Name, api.DownOptions{}); err != nil {
		return fmt.Errorf("compose down operation failed: %w", err)
	}
	return nil
}

func (s *ComposeService) restartStack(ctx context.Context, cli api.Service, project *types.Project) error {
	if err := cli.Restart(ctx, project.Name, api.RestartOptions{}); err != nil {
		return fmt.Errorf("compose restart operation failed: %w", err)
	}
	return nil
}

func (s *ComposeService) stopStack(ctx context.Context, composeCli api.Service, project *types.Project) error {
	if err := composeCli.Stop(ctx, project.Name, api.StopOptions{}); err != nil {
		return fmt.Errorf("compose stop operation failed: %w", err)
	}

	return nil
}

func (s *ComposeService) pullStack(ctx context.Context, composeCli api.Service, project *types.Project) error {
	if err := composeCli.Pull(ctx, project, api.PullOptions{}); err != nil {
		return fmt.Errorf("compose pull operation failed: %w", err)
	}
	return nil
}

func (s *ComposeService) getProjectImageDigests(ctx context.Context, project *types.Project) (map[string]string, error) {
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

func (s *ComposeService) withComposeCli(opts *ComposeConfig, execFn func(composeCli api.Service) error) error {
	if opts.dockerHost == "" {
		opts.dockerHost = s.daemon.DaemonHost()
	}

	dockerCli, err := command.NewDockerCli(
		command.WithCombinedStreams(opts.outputStream),
		command.WithInputStream(opts.inputStream),
	)
	if err != nil {
		return fmt.Errorf("failed to create cli client to docker for compose: %w", err)
	}

	clientOpts := &flags.ClientOptions{Hosts: []string{opts.dockerHost}}
	if err = dockerCli.Initialize(clientOpts); err != nil {
		return err
	}

	comp := compose.NewComposeService(dockerCli)
	return execFn(comp)
}

func (s *ComposeService) withProject(
	ctx context.Context,
	filename string,
	opts *ComposeConfig,
	execFn func(cli api.Service, project *types.Project) error,
) error {
	return s.withComposeCli(opts, func(composeCli api.Service) error {
		filename = filepath.Join(s.composeRoot, filename)
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

		return execFn(composeCli, project)
	})
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
