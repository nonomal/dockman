package docker

import (
	"context"
	"fmt"
	hm "github.com/RA341/dockman/internal/host_manager"
	"github.com/compose-spec/compose-go/v2/cli"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/flags"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/rs/zerolog/log"
	"path/filepath"
	"reflect"
	"strings"
)

// stolen from
// https://github.com/portainer/portainer/blob/develop/pkg/libstack/compose/composeplugin.go

type ComposeService struct {
	composeRoot string
	client      *ContainerService
}

func newComposeService(composeRoot string, client *ContainerService) *ComposeService {
	return &ComposeService{
		composeRoot: composeRoot,
		client:      client,
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

		if err = s.startStack(ctx, cli, project); err != nil {
			return err
		}

		return nil
	})
}

func (s *ComposeService) StatStack(ctx context.Context, filename string, opts ...Opts) ([]ContainerStats, error) {
	var result []ContainerStats
	err := s.withProject(ctx, filename, parseOpts(opts...), func(cli api.Service, project *types.Project) error {
		stackList, err := s.listStack(ctx, cli, project, false)
		if err != nil {
			return err
		}

		result = s.client.GetStatsFromContainerList(ctx, stackList)

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
		var err error
		result, err = s.listStack(ctx, cli, project, true)
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

// showAll: all containers (running and stopped).
func (s *ComposeService) listStack(ctx context.Context, composeCli api.Service, project *types.Project, showAll bool) ([]container.Summary, error) {
	containerFilters := filters.NewArgs()
	projectLabel := fmt.Sprintf("%s=%s", api.ProjectLabel, project.Name)
	containerFilters.Add("label", projectLabel)

	result, err := s.client.daemon().ContainerList(ctx, container.ListOptions{
		All:     showAll,
		Filters: containerFilters,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers for project '%s': %w", project.Name, err)
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

		imageInspect, err := s.client.daemon().ImageInspect(ctx, service.Image)
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
	dockerCli, err := command.NewDockerCli(
		command.WithAPIClient(s.client.daemon()),
		command.WithCombinedStreams(opts.outputStream),
		command.WithInputStream(opts.inputStream),
	)
	if err != nil {
		return fmt.Errorf("failed to create cli client to docker for compose: %w", err)
	}

	clientOpts := &flags.ClientOptions{}
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
		// will be the parent dir of the compose file else equal to compose root
		workingDir := filepath.Dir(filename)

		options, err := cli.NewProjectOptions(
			[]string{filename},
			// important maintain this order to load .env: workingdir -> env -> os -> load dot env
			cli.WithWorkingDirectory(s.composeRoot),
			cli.WithEnvFiles(),
			cli.WithOsEnv,
			cli.WithDotEnv,
			cli.WithDefaultProfiles(),
			cli.WithWorkingDirectory(workingDir),
			cli.WithResolvedPaths(true),
		)
		if err != nil {
			return fmt.Errorf("failed to create new project: %w", err)
		}

		project, err := options.LoadProject(ctx)
		if err != nil {
			return fmt.Errorf("failed to load project: %w", err)
		}

		// nil client implies local client or I done fucked up
		if sfCli := s.client.sftp(); sfCli != nil {
			if err = s.sftpProjectFiles(project, sfCli); err != nil {
				return err
			}
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

func (s *ComposeService) sftpProjectFiles(project *types.Project, sfCli *hm.SftpClient) error {
	for _, service := range project.Services {
		// iterate over each volume mount for that service.
		for _, vol := range service.Volumes {
			// We only care about "bind" mounts, which map a host path to a container path.
			// We ignore named volumes, tmpfs, etc.
			if vol.Bind == nil {
				continue
			}

			// `vol.Source` is the local path on the host machine.
			// Because we used `WithResolvedPaths(true)`, this is an absolute path.
			localSourcePath := vol.Source

			// Copy files only whose volume starts with the project's root directory path.
			if !strings.HasPrefix(localSourcePath, s.composeRoot) {
				log.Debug().
					Str("local", localSourcePath).
					Msg("Skipping bind mount outside of project root")
				continue
			}

			// Before copying, check if the source file/directory actually exists.
			// It might be a path that gets created by another process or container,
			// so just log/skip if it doesn't exist.
			if !hm.FileExists(localSourcePath) {
				log.Debug().Str("path", localSourcePath).Msg("bind mount source path not found, skipping...")
				continue
			}

			// The remote destination path will mirror the local absolute path.
			// This ensures the file structure is identical on the remote host.
			remoteDestPath := localSourcePath
			log.Info().
				Str("name", service.Name).
				Str("src (local)", localSourcePath).
				Str("dest (remote)", remoteDestPath).
				Msg("Syncing bind mount for service")

			if err := sfCli.CopyLocalToRemoteSFTP(localSourcePath, remoteDestPath); err != nil {
				return fmt.Errorf("failed to sync bind mount %s for service %s: %w", localSourcePath, service.Name, err)
			}
		}
	}
	return nil
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
