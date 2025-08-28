package config

import (
	"context"
	"time"

	"connectrpc.com/connect"
	v1 "github.com/RA341/dockman/generated/config/v1"
)

type Handler struct {
	srv Store
}

func NewConnectHandler(srv Store) *Handler {
	return &Handler{
		srv: srv,
	}
}

func (h *Handler) GetUserConfig(context.Context, *connect.Request[v1.Empty]) (*connect.Response[v1.UserConfig], error) {
	config, err := h.srv.GetConfig()
	if err != nil {
		return nil, err
	}

	rpcConfig := ToProto(config)
	return connect.NewResponse(&rpcConfig), nil
}

func (h *Handler) SetUserConfig(_ context.Context, req *connect.Request[v1.UserConfig]) (*connect.Response[v1.Empty], error) {
	userconfig := FromProto(req.Msg)

	err := h.srv.SetConfig(&userconfig)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.Empty{}), nil
}

func ToProto(config *UserConfig) v1.UserConfig {
	return v1.UserConfig{
		UseComposeFolders: config.UseComposeFolders,
		Updater: &v1.ContainerUpdater{
			Enable:            config.ContainerUpdater.Enable,
			IntervalInSeconds: int64(config.ContainerUpdater.Interval.Seconds()),
		},
	}
}

func FromProto(config *v1.UserConfig) UserConfig {
	return UserConfig{
		UseComposeFolders: config.UseComposeFolders,
		ContainerUpdater: ContainerUpdater{
			Enable:   config.Updater.Enable,
			Interval: time.Duration(config.Updater.IntervalInSeconds) * time.Second,
		},
	}
}
