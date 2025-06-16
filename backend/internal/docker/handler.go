package docker

import (
	"connectrpc.com/connect"
	"context"
	v1 "github.com/RA341/dockman/generated/docker/v1"
	"github.com/docker/docker/api/types/container"
)

type Handler struct {
	srv *Service
}

func NewHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) Start(ctx context.Context, req *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Up(ctx, req.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Stop(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Stop(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Restart(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Restart(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Remove(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Down(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Stats(ctx context.Context, _ *connect.Request[v1.Empty]) (*connect.Response[v1.StatsResponse], error) {
	systemInfo, containers, err := h.srv.GetStats(ctx, container.ListOptions{})
	if err != nil {
		return nil, err
	}

	var stats []*v1.ContainerStats
	for _, cont := range containers {
		stats = append(stats, &v1.ContainerStats{
			Id:          cont.ID,
			Name:        cont.Name,
			CpuUsage:    cont.CPUUsage,
			MemoryUsage: cont.MemoryUsage,
			MemoryLimit: cont.MemoryLimit,
			NetworkRx:   cont.NetworkRx,
			NetworkTx:   cont.NetworkTx,
			BlockRead:   cont.BlockRead,
			BlockWrite:  cont.BlockWrite,
		})
	}

	return connect.NewResponse(&v1.StatsResponse{
		System: &v1.SystemInfo{
			CPU:        systemInfo.CPU,
			MemInBytes: systemInfo.Memory.Used,
		},
		Containers: stats,
	}), nil
}

func (h *Handler) Update(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Update(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) List(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.ListResponse], error) {
	result, err := h.srv.ListStack(ctx, c.Msg.GetFilename())
	if err != nil {
		return nil, err
	}

	var dockerResult []*v1.ContainerList
	for _, stack := range result {
		var portSlice []*v1.Port
		for _, v := range stack.Ports {
			portSlice = append(portSlice, &v1.Port{
				Public:  int32(v.PublicPort),
				Private: int32(v.PrivatePort),
				Host:    v.IP,
				Type:    v.Type,
			})
		}

		res := &v1.ContainerList{
			Id:        stack.ID,
			ImageID:   stack.ImageID,
			ImageName: stack.Image,
			Status:    stack.Status,
			Name:      stack.Names[0],
			Ports:     portSlice,
		}
		dockerResult = append(dockerResult, res)
	}

	return connect.NewResponse(&v1.ListResponse{List: dockerResult}), err
}
