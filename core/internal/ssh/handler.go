package ssh

import (
	"connectrpc.com/connect"
	"context"
	v1 "github.com/RA341/dockman/generated/ssh/v1"
)

type Handler struct {
	srv *Service
}

func NewConnectHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h Handler) NewClient(_ context.Context, req *connect.Request[v1.Machine]) (*connect.Response[v1.Empty], error) {
	mes := FromProto(req.Msg)

	if _, err := h.srv.NewSSHClient(&mes); err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.Empty{}), nil
}

func (h Handler) DeleteClient(_ context.Context, req *connect.Request[v1.Machine]) (*connect.Response[v1.Empty], error) {
	err := h.srv.Machines.Delete(FromProto(req.Msg))
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.Empty{}), nil
}

func (h Handler) List(_ context.Context, req *connect.Request[v1.Empty]) (*connect.Response[v1.ListMachine], error) {
	list, err := h.srv.Machines.List()
	if err != nil {
		return nil, err
	}

	var resList []*v1.Machine
	for _, m := range list {
		resList = append(resList, ToProto(m))
	}

	return connect.NewResponse(&v1.ListMachine{Machines: resList}), nil
}

func (h Handler) Get(_ context.Context, req *connect.Request[v1.GetMachine]) (*connect.Response[v1.Machine], error) {
	mach, err := h.srv.Machines.Get(req.Msg.Name)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(ToProto(mach)), nil
}

func FromProto(machine *v1.Machine) MachineOptions {
	return MachineOptions{
		ID:               machine.Id,
		Name:             machine.Name,
		Enable:           machine.Enable,
		Host:             machine.Host,
		Port:             int(machine.Port),
		User:             machine.User,
		Password:         machine.Password,
		UsePublicKeyAuth: machine.UsePublicKeyAuth,
	}
}

func ToProto(options MachineOptions) *v1.Machine {
	return &v1.Machine{
		Id:               options.ID,
		Name:             options.Name,
		Enable:           options.Enable,
		Host:             options.Host,
		Port:             int32(options.Port),
		User:             options.User,
		Password:         options.Password,
		UsePublicKeyAuth: options.UsePublicKeyAuth,
	}
}
