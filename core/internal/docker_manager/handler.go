package docker_manager

import (
	"connectrpc.com/connect"
	"context"
	v1 "github.com/RA341/dockman/generated/docker_manager/v1"
)

type Handler struct {
	srv *Service
}

func NewConnectHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) List(_ context.Context, _ *connect.Request[v1.Empty]) (*connect.Response[v1.ListResponse], error) {
	clients := h.srv.manager.List()
	active := h.srv.manager.Active()

	var protoClients []*v1.Machine
	for _, name := range clients {
		protoClients = append(protoClients, &v1.Machine{
			Name: name,
		})
	}

	return connect.NewResponse(&v1.ListResponse{
		Machines:     protoClients,
		ActiveClient: active,
	}), nil
}

func (h *Handler) SwitchClient(_ context.Context, c *connect.Request[v1.SwitchRequest]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.SwitchClient(c.Msg.MachineID); err != nil {
		return nil, err
	}
	return connect.NewResponse(&v1.Empty{}), nil
}
