package docker

import (
	"bufio"
	"cmp"
	"connectrpc.com/connect"
	"context"
	v1 "github.com/RA341/dockman/generated/docker/v1"
	"github.com/RA341/dockman/pkg"
	"github.com/docker/docker/api/types/container"
	"github.com/rs/zerolog/log"
	"io"
	"net"
	"slices"
	"strings"
	"sync"
)

type Handler struct {
	srv *Service
}

func NewConnectHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) Start(_ context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.ComposeActionResponse]) error {
	pipeWriter, wg := streamManager(func(val string) error {
		if err := responseStream.Send(&v1.ComposeActionResponse{Message: val}); err != nil {
			return err
		}
		return nil
	})

	if err := h.srv.Up(context.Background(), req.Msg.GetFilename(), WithOutput(pipeWriter)); err != nil {
		pkg.CloseFile(pipeWriter)
		return err
	}
	pkg.CloseFile(pipeWriter)

	wg.Wait() // all data must be sent
	return nil
}

func (h *Handler) Stop(_ context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.ComposeActionResponse]) error {
	pipeWriter, wg := streamManager(func(val string) error {
		if err := responseStream.Send(&v1.ComposeActionResponse{Message: val}); err != nil {
			return err
		}
		return nil
	})

	if err := h.srv.Stop(context.Background(), req.Msg.GetFilename(), WithOutput(pipeWriter)); err != nil {
		pkg.CloseFile(pipeWriter)
		return err
	}
	pkg.CloseFile(pipeWriter)

	wg.Wait() // all data must be sent
	return nil
}

func (h *Handler) Remove(_ context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.ComposeActionResponse]) error {
	pipeWriter, wg := streamManager(func(val string) error {
		if err := responseStream.Send(&v1.ComposeActionResponse{Message: val}); err != nil {
			return err
		}
		return nil
	})

	if err := h.srv.Down(context.Background(), req.Msg.GetFilename(), WithOutput(pipeWriter)); err != nil {
		pkg.CloseFile(pipeWriter)
		return err
	}
	pkg.CloseFile(pipeWriter)

	wg.Wait() // all data must be sent
	return nil
}

func (h *Handler) Restart(_ context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.ComposeActionResponse]) error {
	pipeWriter, wg := streamManager(func(val string) error {
		if err := responseStream.Send(&v1.ComposeActionResponse{Message: val}); err != nil {
			return err
		}
		return nil
	})

	if err := h.srv.Restart(context.Background(), req.Msg.GetFilename(), WithOutput(pipeWriter)); err != nil {
		pkg.CloseFile(pipeWriter)
		return err
	}
	pkg.CloseFile(pipeWriter)

	wg.Wait() // all data must be sent
	return nil
}

func (h *Handler) Update(_ context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.ComposeActionResponse]) error {
	pipeWriter, wg := streamManager(func(val string) error {
		if err := responseStream.Send(&v1.ComposeActionResponse{Message: val}); err != nil {
			return err
		}
		return nil
	})

	if err := h.srv.Update(context.Background(), req.Msg.GetFilename(), WithOutput(pipeWriter)); err != nil {
		pkg.CloseFile(pipeWriter)
		return err
	}
	pkg.CloseFile(pipeWriter)

	wg.Wait() // all data must be sent
	return nil
}

func (h *Handler) Stats(ctx context.Context, req *connect.Request[v1.StatsRequest]) (*connect.Response[v1.StatsResponse], error) {
	file := req.Msg.GetFile()

	var containers []ContainerStats
	var err error
	if file != nil {
		containers, err = h.srv.StatStack(ctx, file.Filename)
	} else {
		containers, err = h.srv.GetStats(ctx, container.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	field := req.Msg.GetSortBy().Enum()
	if field == nil {
		field = v1.SORT_FIELD_NAME.Enum()
	}
	// returns in desc order
	fn := getSortFn(*field)
	containers = slices.SortedStableFunc(slices.Values(containers), fn)

	orderby := *req.Msg.Order.Enum()

	var stats []*v1.ContainerStats
	if orderby == v1.ORDER_ASC {
		// rev dsc list
		for i := len(containers) - 1; i >= 0; i-- {
			stats = append(stats, ToRPCStat(containers[i]))
		}
	} else {
		// containers already in dsc order
		for _, cont := range containers {
			stats = append(stats, ToRPCStat(cont))
		}
	}

	return connect.NewResponse(&v1.StatsResponse{
		System: &v1.SystemInfo{
			//	CPU:        systemInfo.CPU,
			//	MemInBytes: systemInfo.Memory.Used,
		},
		Containers: stats,
	}), nil
}

func ToRPCStat(cont ContainerStats) *v1.ContainerStats {
	return &v1.ContainerStats{
		Id:          cont.ID,
		Name:        strings.TrimPrefix(cont.Name, "/"),
		CpuUsage:    cont.CPUUsage,
		MemoryUsage: cont.MemoryUsage,
		MemoryLimit: cont.MemoryLimit,
		NetworkRx:   cont.NetworkRx,
		NetworkTx:   cont.NetworkTx,
		BlockRead:   cont.BlockRead,
		BlockWrite:  cont.BlockWrite,
	}
}

func isIPV4(ip string) bool {
	parsedIP := net.ParseIP(ip)
	return parsedIP != nil && parsedIP.To4() != nil
}

func getSortFn(field v1.SORT_FIELD) func(a, b ContainerStats) int {
	switch field {
	case v1.SORT_FIELD_CPU:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.CPUUsage, a.CPUUsage)
		}
	case v1.SORT_FIELD_MEM:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.MemoryUsage, a.MemoryUsage)
		}
	case v1.SORT_FIELD_NETWORK_RX:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.NetworkRx, a.NetworkRx)
		}
	case v1.SORT_FIELD_NETWORK_TX:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.NetworkTx, a.NetworkTx)
		}
	case v1.SORT_FIELD_DISK_W:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.BlockWrite, a.BlockWrite)
		}
	case v1.SORT_FIELD_DISK_R:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.BlockRead, a.BlockRead)
		}
	case v1.SORT_FIELD_NAME:
		fallthrough
	default:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.Name, a.Name)
		}
	}
}

func (h *Handler) List(ctx context.Context, req *connect.Request[v1.ComposeFile]) (*connect.Response[v1.ListResponse], error) {
	result, err := h.srv.ListStack(ctx, req.Msg.GetFilename())
	if err != nil {
		return nil, err
	}

	var dockerResult []*v1.ContainerList
	for _, stack := range result {
		var portSlice []*v1.Port
		for _, p := range stack.Ports {
			if isIPV4(p.IP) {
				p.IP = h.srv.localAddress // use the local addr found from docker
				// ignore ipv6 ports no one uses it anyway
				portSlice = append(portSlice, toRPCPort(p))
			}
		}
		dockerResult = append(dockerResult, toRPContainer(stack, portSlice))
	}

	return connect.NewResponse(&v1.ListResponse{List: dockerResult}), err
}

func streamManager(streamFn func(val string) error) (*io.PipeWriter, *sync.WaitGroup) {
	pipeReader, pipeWriter := io.Pipe()
	wg := sync.WaitGroup{}
	// Start a goroutine that reads from the pipe, splits the data into lines,
	// and sends each line as a message on the response stream.
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer pkg.CloseFile(pipeReader)

		scanner := bufio.NewScanner(pipeReader)
		for scanner.Scan() {
			err := streamFn(scanner.Text())
			if err != nil {
				log.Warn().Err(err).Msg("Failed to send message to stream")
			}
		}
		// If the scanner stops because of an error, log it.
		if err := scanner.Err(); err != nil {
			log.Error().Err(err).Msg("Error reading from pipe for streaming")
		}
	}()

	return pipeWriter, &wg
}

func toRPCPort(p container.Port) *v1.Port {
	return &v1.Port{
		Public:  int32(p.PublicPort),
		Private: int32(p.PrivatePort),
		Host:    p.IP,
		Type:    p.Type,
	}
}

func toRPContainer(stack container.Summary, portSlice []*v1.Port) *v1.ContainerList {
	return &v1.ContainerList{
		Id:        stack.ID,
		ImageID:   stack.ImageID,
		ImageName: stack.Image,
		Status:    stack.Status,
		Name:      stack.Names[0],
		Ports:     portSlice,
	}

}
