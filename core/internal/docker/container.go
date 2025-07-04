package docker

import (
	"context"
	"encoding/json"
	"fmt"
	dm "github.com/RA341/dockman/internal/docker_manager"
	"github.com/RA341/dockman/pkg"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/rs/zerolog/log"
	"io"
	"sync"
)

// SystemInfo holds all the collected system metrics.
type SystemInfo struct {
	CPU float64 // Total CPU usage percentage
}

// ContainerStats holds metrics for a single Docker container.
type ContainerStats struct {
	ID          string
	Name        string
	CPUUsage    float64
	MemoryUsage uint64 // in bytes
	MemoryLimit uint64 // in bytes
	NetworkRx   uint64 // bytes received
	NetworkTx   uint64 // bytes sent
	BlockRead   uint64 // bytes read from block devices
	BlockWrite  uint64 // bytes written to block devices
}

type ContainerService struct {
	daemon dm.GetDocker
	sftp   dm.GetSftp
}

func (s *ContainerService) ListContainers(ctx context.Context, filter container.ListOptions) ([]container.Summary, error) {
	containers, err := s.daemon().ContainerList(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("could not list containers: %w", err)
	}

	return containers, nil
}

func (s *ContainerService) GetStats(ctx context.Context, filter container.ListOptions) ([]ContainerStats, error) {
	containerInfo, err := s.StatContainers(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get container stats: %w", err)
	}

	return containerInfo, nil
}

func (s *ContainerService) ContainerLogs(ctx context.Context, containerID string) (io.ReadCloser, error) {
	return s.daemon().ContainerLogs(ctx, containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Details:    true,
	})
}

func (s *ContainerService) StatContainers(ctx context.Context, filter container.ListOptions) ([]ContainerStats, error) {
	containers, err := s.ListContainers(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("could not list containers: %w", err)
	}

	if len(containers) == 0 {
		return []ContainerStats{}, nil
	}

	statsList := s.GetStatsFromContainerList(ctx, containers)

	return statsList, nil
}

func parallelLoop[T any, R any](input []R, mapper func(R) (T, bool)) []T {
	contChan := make(chan T, len(input))

	var wg sync.WaitGroup
	for _, cont := range input {
		wg.Add(1)
		go func(i R) {
			defer wg.Done()
			res, ok := mapper(i)
			if ok {
				contChan <- res
			}
		}(cont)
	}

	go func() {
		wg.Wait()
		close(contChan)
	}()

	var result []T
	for c := range contChan {
		result = append(result, c)
	}

	return result
}

func (s *ContainerService) GetStatsFromContainerList(ctx context.Context, containers []container.Summary) []ContainerStats {
	return parallelLoop(containers, func(r container.Summary) (ContainerStats, bool) {
		stats, err := s.getStats(ctx, r)
		if err != nil {
			log.Warn().Err(err).Str("container", r.ID[:12]).Msg("could not convert stats, skipping...")
			return ContainerStats{}, false
		}
		return stats, true
	})
}

func (s *ContainerService) getStats(ctx context.Context, info container.Summary) (ContainerStats, error) {
	contId := info.ID[:12]
	stats, err := s.daemon().ContainerStats(ctx, info.ID, false)
	if err != nil {
		return ContainerStats{}, fmt.Errorf("failed to get stats for cont %s: %w", contId, err)
	}
	defer pkg.CloseFile(stats.Body)

	body, err := io.ReadAll(stats.Body)
	if err != nil {
		return ContainerStats{}, fmt.Errorf("failed to read body for cont %s: %w", contId, err)
	}
	var statsJSON container.StatsResponse
	if err := json.Unmarshal(body, &statsJSON); err != nil {
		return ContainerStats{}, fmt.Errorf("failed to unmarshal body for cont %s: %w", contId, err)
	}

	cpuPercent := formatCPU(statsJSON)
	rx, tx := formatNetwork(statsJSON)
	blkRead, blkWrite := formatDiskIO(statsJSON)

	return ContainerStats{
		ID:          contId,
		Name:        info.Names[0],
		CPUUsage:    cpuPercent,
		MemoryUsage: statsJSON.MemoryStats.Usage,
		MemoryLimit: statsJSON.MemoryStats.Limit,
		NetworkRx:   rx,
		NetworkTx:   tx,
		BlockRead:   blkRead,
		BlockWrite:  blkWrite,
	}, nil
}

func formatDiskIO(statsJSON container.StatsResponse) (uint64, uint64) {
	var blkRead, blkWrite uint64
	for _, bioEntry := range statsJSON.BlkioStats.IoServiceBytesRecursive {
		switch bioEntry.Op {
		case "read":
			blkRead += bioEntry.Value
		case "write":
			blkWrite += bioEntry.Value
		}
	}
	return blkRead, blkWrite
}

// Collect Network and Disk I/O
func formatNetwork(statsJSON container.StatsResponse) (uint64, uint64) {
	var rx, tx uint64
	for _, v := range statsJSON.Networks {
		rx += v.RxBytes
		tx += v.TxBytes
	}
	return rx, tx
}

// PreviousCPUStats This struct will hold the essential previous values for a single container.
type PreviousCPUStats struct {
	TotalUsage  uint64
	SystemUsage uint64
}

// A thread-safe cache to store the last stats for each container ID.
// The key will be the container ID (string).
var (
	statsCache = pkg.Map[string, PreviousCPUStats]{}
	cacheLock  = &sync.Mutex{}
)

// MODIFIED - A stateful CPU calculation function
func calculateCPUPercent(currentStats container.StatsResponse) float64 {
	// Lock the cache for safe concurrent access
	cacheLock.Lock()
	defer cacheLock.Unlock()

	// Get the previous stats from our cache for this container
	previous, hasPrevious := statsCache.Load(currentStats.ID)

	// On the first run for a container, we don't have previous stats, so we can't calculate.
	// We store the current stats and return 0.
	if !hasPrevious {
		statsCache.Store(currentStats.ID, PreviousCPUStats{
			TotalUsage:  currentStats.CPUStats.CPUUsage.TotalUsage,
			SystemUsage: currentStats.CPUStats.SystemUsage,
		})
		return 0.0
	}

	// We have previous stats, so we can calculate the deltas
	cpuDelta := float64(currentStats.CPUStats.CPUUsage.TotalUsage - previous.TotalUsage)
	systemCpuDelta := float64(currentStats.CPUStats.SystemUsage - previous.SystemUsage)

	// Get the number of CPUs
	numberCPUs := float64(currentStats.CPUStats.OnlineCPUs)
	if numberCPUs == 0.0 {
		numberCPUs = float64(len(currentStats.CPUStats.CPUUsage.PercpuUsage))
	}

	var cpuPercent float64 = 0.0
	// The main calculation, guarded against division by zero
	if systemCpuDelta > 0.0 && cpuDelta > 0.0 {
		cpuPercent = (cpuDelta / systemCpuDelta) * numberCPUs * 100.0
	}

	// Update the cache with the current stats for the next calculation
	statsCache.Store(currentStats.ID, PreviousCPUStats{
		TotalUsage:  currentStats.CPUStats.CPUUsage.TotalUsage,
		SystemUsage: currentStats.CPUStats.SystemUsage,
	})
	return cpuPercent
}

func formatCPU(statsJSON container.StatsResponse) float64 {
	cpuDelta := float64(statsJSON.CPUStats.CPUUsage.TotalUsage - statsJSON.PreCPUStats.CPUUsage.TotalUsage)
	systemCpuDelta := float64(statsJSON.CPUStats.SystemUsage - statsJSON.PreCPUStats.SystemUsage)
	numberCPUs := float64(statsJSON.CPUStats.OnlineCPUs)
	if numberCPUs == 0.0 {
		numberCPUs = float64(len(statsJSON.CPUStats.CPUUsage.PercpuUsage))
	}

	var cpuPercent float64 = 0.0
	// Avoid division by zero
	if systemCpuDelta > 0.0 && cpuDelta > 0.0 {
		cpuPercent = (cpuDelta / systemCpuDelta) * numberCPUs * 100.0
	}

	return cpuPercent
}

func filterByLabels(projectname string) {
	containerFilters := filters.NewArgs()
	projectLabel := fmt.Sprintf("%s=%s", api.ProjectLabel, projectname)
	containerFilters.Add("label", projectLabel)
}
