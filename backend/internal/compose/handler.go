package compose

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	comprpc "github.com/RA341/dockman/backend/generated/compose/v1"
)

type Handler struct {
	srv *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{srv: service}
}

func (h *Handler) Create(ctx context.Context, c *connect.Request[comprpc.ComposeFile]) (*connect.Response[comprpc.Empty], error) {
	msg := c.Msg.GetName()
	if msg == "" {
		return nil, fmt.Errorf("name is empty")
	}

	err := h.srv.Create(msg)
	if err != nil {
		return nil, err
	}

	return &connect.Response[comprpc.Empty]{}, nil
}

func (h *Handler) Delete(ctx context.Context, c *connect.Request[comprpc.ComposeFile]) (*connect.Response[comprpc.Empty], error) {
	msg := c.Msg.GetName()
	if msg == "" {
		return nil, fmt.Errorf("name is empty")
	}

	err := h.srv.Delete(msg)
	if err != nil {
		return nil, err
	}

	return &connect.Response[comprpc.Empty]{}, nil

}

func (h *Handler) List(_ context.Context, _ *connect.Request[comprpc.Empty]) (*connect.Response[comprpc.ListResponse], error) {
	flist, err := h.srv.List()
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&comprpc.ListResponse{Files: flist}), nil
}

func (h *Handler) Load(ctx context.Context, c *connect.Request[comprpc.ComposeFile]) (*connect.Response[comprpc.ComposeFile], error) {
	_, err := h.srv.Load(c.Msg.GetName())
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(
		&comprpc.ComposeFile{
			Name: c.Msg.GetName(),
		},
	), nil
}

func (h *Handler) Edit(ctx context.Context, c *connect.Request[comprpc.ComposeFile]) (*connect.Response[comprpc.ComposeFile], error) {
	err := h.srv.Update(c.Msg.GetName())
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&comprpc.ComposeFile{}), nil
}
