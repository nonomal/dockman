package docker

import (
	"connectrpc.com/connect"
	"context"
	v1 "github.com/RA341/dockman/generated/docker/v1"
)

type Handler struct {
	srv *Service
}

func NewHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) Start(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Up(ctx, c.Msg.GetFilename()); err != nil {
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

func (h *Handler) Remove(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Down(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Update(ctx context.Context, c *connect.Request[v1.ComposeFile]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Update(ctx, c.Msg.GetFilename()); err != nil {
		return nil, err
	}
	return &connect.Response[v1.Empty]{}, nil
}
