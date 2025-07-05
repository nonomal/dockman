package docker

import (
	"testing"
)

func TestStats(t *testing.T) {
	//opts, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	//require.NoError(t, err)
	//
	//service := ContainerService{daemon: opts}
	//
	//containerInfo, err := service.GetStats(context.Background(), container.ListOptions{})
	//require.NoError(t, err)
	//
	//// Calculate resources used by the host system *only*.
	//var totalContainerCPU float64
	//var totalContainerMem uint64
	//for _, c := range containerInfo {
	//	totalContainerCPU += c.CPUUsage
	//	totalContainerMem += c.MemoryUsage
	//}
	//
	//// Subtract container usage from total system usage.
	//// This is an approximation. CPU percentages can sometimes exceed 100% in total.
	//systemOnlyCPU := systemInfo.CPU - totalContainerCPU
	//systemOnlyMem := systemInfo.Memory.Used - totalContainerMem
	//
	//fmt.Println("--- Host System Only Resources ---")
	//fmt.Printf("CPU Usage: %.2f%%\n", systemOnlyCPU)
	//fmt.Printf("Memory Usage: %d MB\n\n", systemOnlyMem/1024/1024)
	//
	//if len(containerInfo) > 0 {
	//	fmt.Println("--- Docker Container Resources ---")
	//	for _, c := range containerInfo {
	//		memUsageMB := float64(c.MemoryUsage) / 1024 / 1024
	//		memLimitMB := float64(c.MemoryLimit) / 1024 / 1024
	//		memPercent := (float64(c.MemoryUsage) / float64(c.MemoryLimit)) * 100.0
	//
	//		fmt.Printf("Container: %s (%s)\n", c.Name, c.ID)
	//		fmt.Printf("  CPU: %.2f%%\n", c.CPUUsage)
	//		fmt.Printf("  Memory: %.2f MB / %.2f MB (%.2f%%)\n", memUsageMB, memLimitMB, memPercent)
	//		fmt.Printf("  Network I/O (Rx/Tx): %d KB / %d KB\n", c.NetworkRx/1024, c.NetworkTx/1024)
	//		fmt.Printf("  Block I/O (Read/Write): %d KB / %d KB\n", c.BlockRead/1024, c.BlockWrite/1024)
	//		fmt.Println()
	//	}
	//} else {
	//	fmt.Println("--- No Running Docker Containers Found ---")
	//}

}
