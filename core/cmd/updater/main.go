package main

import (
	"context"
	"fmt"
	"github.com/RA341/dockman/internal/docker"
	"github.com/RA341/dockman/internal/docker_manager"
	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
	"os"
	"strings"
)

var composeClient *docker.ComposeService

func init() {
	log.Logger = log.With().Logger().Output(
		zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: "2006-01-02 15:04:05",
		},
	)

	cli, err := docker_manager.NewLocalClient()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to local docker client")
		return
	}

	syncer := &docker.NoopSyncer{}
	composeClient = docker.NewComposeService(
		conf.ComposeRoot,
		docker.NewContainerService(cli),
		syncer,
	)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /update", updateHandler)

	port := "8869"
	log.Info().Str("port", port).Msg("Dockman updater starting...")

	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), mux); err != nil {
		log.Fatal().Err(err).Msg("Failed to start Dockman updater")
	}
}

// updateHandler is our handler function.
func updateHandler(w http.ResponseWriter, r *http.Request) {
	pathAuthKey := r.Header.Get("Authorization")
	if pathAuthKey == "" || conf.UpdaterKey != pathAuthKey {
		http.Error(w, "invalid Authorization", http.StatusForbidden)
		return
	}

	filepath := r.FormValue("composeFile")
	if filepath == "" {
		http.Error(w, "composeFile is required", http.StatusBadRequest)
		return
	}

	log.Info().Str("path", filepath).Msg("Received a valid update request")
	w.WriteHeader(http.StatusOK)

	// update in background
	go Update(filepath)
}

func Update(path string) {
	log.Info().Msg("Updating dockman container")
	ctx := context.Background()

	project, err := composeClient.LoadProject(ctx, path)
	if err != nil {
		log.Error().Err(err).Msg("Failed to load project")
		return
	}

	cli, err := composeClient.LoadComposeClient(os.Stdout, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to load compose client")
		return
	}

	if err = composeClient.ComposeUpdate(ctx, project, cli); err != nil {
		log.Error().Err(err).Msg("Failed to update project")
		return
	}

	//if err := UpdateContainersForImage(context.Background(), localDockerClient, conf.UpdaterImage); err != nil {
	//	log.Error().Err(err).Msg("Failed to update dockman container")
	//	return
	//}
}

// UpdateContainersForImage finds all containers using the specified image,
// pulls the latest version of the image, and recreates the containers
// with the new image while preserving their configuration.
func UpdateContainersForImage(ctx context.Context, cli *client.Client, imageName string) error {
	log.Info().Str("image", imageName).Msg("Starting update for image")

	log.Info().Msg("Pulling latest image to ensure we have the newest version...")
	reader, err := cli.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image %s: %w", imageName, err)
	}
	defer fileutil.Close(reader)

	// Copy the pull output to stdout to show progress
	if _, err := io.Copy(os.Stdout, reader); err != nil {
		return fmt.Errorf("failed to read image pull response: %w", err)
	}
	log.Info().Msg("Image pull complete.")

	// Find all containers using this image
	containerFilters := filters.NewArgs()
	containerFilters.Add("ancestor", imageName)

	containers, err := cli.ContainerList(ctx, container.ListOptions{
		All:     true, // Consider both running and stopped containers
		Filters: containerFilters,
	})
	if err != nil {
		return fmt.Errorf("failed to list containers for image %s: %w", imageName, err)
	}

	if len(containers) == 0 {
		log.Info().Msgf("No containers found using image %s. Nothing to do.", imageName)
		return nil
	}

	log.Info().Msgf("Found %d container(s) to update.", len(containers))

	// Recreate each container
	for _, oldContainer := range containers {
		containerName := "N/A"
		if len(oldContainer.Names) > 0 {
			// Names have a leading '/' which we should trim
			containerName = strings.TrimPrefix(oldContainer.Names[0], "/")
		}
		log.Info().Msgf("Processing container: %s (ID: %s)", containerName, oldContainer.ID[:12])

		// Inspect the old container to get its configuration
		log.Info().Msgf("Inspecting old container %s...", containerName)
		inspectedData, err := cli.ContainerInspect(ctx, oldContainer.ID)
		if err != nil {
			return fmt.Errorf("failed to inspect container %s: %w", oldContainer.ID, err)
		}

		// Stop and remove the old container
		log.Info().Msgf("Stopping old container %s...", containerName)
		if err := cli.ContainerStop(ctx, oldContainer.ID, container.StopOptions{}); err != nil {
			return fmt.Errorf("failed to stop container %s: %w", oldContainer.ID, err)
		}
		log.Info().Msgf("Removing old container %s...", containerName)
		if err := cli.ContainerRemove(ctx, oldContainer.ID, container.RemoveOptions{}); err != nil {
			return fmt.Errorf("failed to remove container %s: %w", oldContainer.ID, err)
		}

		// Create a new container with the same configuration but the new image
		log.Info().Msgf("Creating new container %s with updated image...", containerName)

		// The inspected config has the old image name, so we update it.
		inspectedData.Config.Image = imageName

		// Prepare the networking configuration
		networkingConfig := &network.NetworkingConfig{
			EndpointsConfig: inspectedData.NetworkSettings.Networks,
		}

		newContainer, err := cli.ContainerCreate(ctx,
			inspectedData.Config,     // Container configuration
			inspectedData.HostConfig, // Host configuration (ports, volumes, etc.)
			networkingConfig,         // Networking configuration
			nil,                      // Platform (can be nil)
			containerName,            // The original container name
		)
		if err != nil {
			return fmt.Errorf("failed to create new container for %s: %w", containerName, err)
		}

		// Start the new container
		log.Info().Msgf("Starting new container %s (ID: %s)...", containerName, newContainer.ID[:12])
		if err := cli.ContainerStart(ctx, newContainer.ID, container.StartOptions{}); err != nil {
			return fmt.Errorf("failed to start new container %s: %w", newContainer.ID, err)
		}

		log.Info().Msgf("Successfully updated container %s.", containerName)
	}

	// Prune old, dangling images
	log.Info().Msg("Cleaning up old, dangling images...")
	pruneReport, err := cli.ImagesPrune(ctx, filters.Args{})
	if err != nil {
		log.Warn().Err(err).Msg("failed to prune images") // Non-fatal
	}
	if len(pruneReport.ImagesDeleted) > 0 {
		log.Info().Msgf("Pruned %d images, reclaimed %d bytes.", len(pruneReport.ImagesDeleted), pruneReport.SpaceReclaimed)
	} else {
		log.Info().Msg("No old images to prune.")
	}

	log.Info().Str("image", imageName).Msg("Update process for image %s completed successfully.")
	return nil
}
