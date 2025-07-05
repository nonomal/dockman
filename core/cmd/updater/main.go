package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
)

const imageToUpdate = "ghcr.io/ra341/dockman:develop"

func main() {

	ctx := context.Background()

	containerNameToUpdate := "my-nginx-container"

	// --- 1. Initialize Docker Client ---
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		panic(fmt.Errorf("failed to create docker client: %w", err))
	}
	defer cli.Close()
	fmt.Printf("Successfully connected to Docker daemon.\n\n")

	// --- 2. Pull the latest image ---
	fmt.Printf("Pulling latest image for %s...\n", imageToUpdate)
	out, err := cli.ImagePull(ctx, imageToUpdate, types.ImagePullOptions{})
	if err != nil {
		panic(fmt.Errorf("failed to pull image: %w", err))
	}
	defer out.Close()
	io.Copy(os.Stdout, out)
	fmt.Println("\nImage pull complete.")

	// Find the container to update by name
	fmt.Printf("Searching for container named '%s' to update...\n", containerNameToUpdate)
	containerFilters := filters.NewArgs()
	containerFilters.Add("name", containerNameToUpdate)

	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
		All:     true, // List all containers (including stopped)
		Filters: containerFilters,
	})
	if err != nil {
		panic(fmt.Errorf("failed to list containers: %w", err))
	}

	if len(containers) == 0 {
		fmt.Printf("No container named '%s' found. You may want to create one from scratch.\n", containerNameToUpdate)
		// For this example, we'll stop here. You could add logic to create a new one.
		return
	}

	// --- 4. Get the old container's configuration ---
	oldContainer := containers[0]
	fmt.Printf("Found old container %s. Inspecting it to preserve settings...\n", oldContainer.ID[:12])

	oldContainerInfo, err := cli.ContainerInspect(ctx, oldContainer.ID)
	if err != nil {
		panic(fmt.Errorf("failed to inspect container %s: %w", oldContainer.ID, err))
	}

	// --- 5. Stop and Rename the old container (for rollback safety) ---
	fmt.Println("Stopping old container...")
	if err := cli.ContainerStop(ctx, oldContainer.ID, container.StopOptions{}); err != nil {
		panic(fmt.Errorf("failed to stop container %s: %w", oldContainer.ID, err))
	}

	backupName := oldContainer.ID[:12] + "-backup-" + time.Now().Format("20060102150405")
	fmt.Printf("Renaming old container to '%s'...\n", backupName)
	if err := cli.ContainerRename(ctx, oldContainer.ID, backupName); err != nil {
		panic(fmt.Errorf("failed to rename container %s: %w", oldContainer.ID, err))
	}

	// --- 6. Create a new container with the preserved configuration ---
	fmt.Println("Creating new container with updated image...")

	// The config is copied from the old container.
	newContainerConfig := oldContainerInfo.Config
	// CRITICAL: We update the image to the one we just pulled.
	newContainerConfig.Image = imageToUpdate

	// The host config is copied from the old container.
	newHostConfig := oldContainerInfo.HostConfig

	// The network config is copied from the old container.
	newNetworkConfig := &network.NetworkingConfig{
		EndpointsConfig: oldContainerInfo.NetworkSettings.Networks,
	}

	// Create the new container with the original name.
	resp, err := cli.ContainerCreate(ctx, newContainerConfig, newHostConfig, newNetworkConfig, nil, containerNameToUpdate)
	if err != nil {
		// ROLLBACK
		fmt.Println("!!! FAILED to create new container. Rolling back...")
		// Rename the old container back
		if errRename := cli.ContainerRename(ctx, oldContainer.ID, containerNameToUpdate); errRename != nil {
			fmt.Printf("!!! CRITICAL: Failed to rename backup container back: %v\n", errRename)
			fmt.Printf("!!! MANUAL INTERVENTION REQUIRED. The old container is '%s'\n", backupName)
		} else {
			// Restart the old container
			if errStart := cli.ContainerStart(ctx, oldContainer.ID, types.ContainerStartOptions{}); errStart != nil {
				fmt.Printf("!!! CRITICAL: Failed to restart old container: %v\n", errStart)
			} else {
				fmt.Println("Rollback successful. The old container is running again.")
			}
		}
		panic(fmt.Errorf("failed to create new container: %w", err))
	}

	// --- 7. Start the new container ---
	fmt.Printf("Starting new container %s...\n", resp.ID[:12])
	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		// You could add rollback logic here as well, but for simplicity we'll panic.
		panic(fmt.Errorf("failed to start new container: %w", err))
	}

	// --- 8. Cleanup: Remove the old (renamed) container ---
	fmt.Printf("New container started successfully. Removing old backup container '%s'...\n", backupName)
	if err := cli.ContainerRemove(ctx, oldContainer.ID, types.ContainerRemoveOptions{RemoveVolumes: false, Force: true}); err != nil {
		fmt.Printf("Warning: failed to remove old container %s: %v\n", backupName, err)
		fmt.Println("You may need to remove it manually.")
	}

	fmt.Printf("\nUpdate complete! New container '%s' (%s) is running.\n", containerNameToUpdate, resp.ID[:12])
}
