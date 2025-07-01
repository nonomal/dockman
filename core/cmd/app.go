package cmd

import (
	"connectrpc.com/connect"
	"fmt"
	authrpc "github.com/RA341/dockman/generated/auth/v1/v1connect"
	dockerpc "github.com/RA341/dockman/generated/docker/v1/v1connect"
	filesrpc "github.com/RA341/dockman/generated/files/v1/v1connect"
	gitrpc "github.com/RA341/dockman/generated/git/v1/v1connect"
	hostrpc "github.com/RA341/dockman/generated/host_manager/v1/v1connect"
	"github.com/RA341/dockman/internal/auth"
	"github.com/RA341/dockman/internal/config"
	"github.com/RA341/dockman/internal/docker"
	"github.com/RA341/dockman/internal/files"
	"github.com/RA341/dockman/internal/git"
	hm "github.com/RA341/dockman/internal/host_manager"
	"github.com/RA341/dockman/internal/info"
	logger "github.com/RA341/dockman/pkg"
	"github.com/RA341/dockman/pkg/lsp"
	"github.com/rs/zerolog/log"
	"net/http"
	"path/filepath"
	"strings"
)

func init() {
	info.PrintInfo()
	logger.ConsoleLogger()
}

type App struct {
	Config      *config.AppConfig
	Auth        *auth.Service
	File        *files.Service
	Git         *git.Service
	Docker      *docker.Service
	HostManager *hm.Service
}

func NewApp(conf *config.AppConfig) (*App, error) {
	absComposeRoot, err := filepath.Abs(strings.TrimSpace(conf.ComposeRoot))
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path for compose root: %w", err)
	}

	authSrv := auth.NewService()
	fileSrv := files.NewService(absComposeRoot)
	gitSrv := git.NewService(absComposeRoot)
	hostSrv := hm.NewService()
	dockerSrv := docker.NewService(absComposeRoot, hostSrv.Manager.GetClientFn())

	log.Info().Msg("Dockman initialized successfully")
	return &App{
		Config:      conf,
		Auth:        authSrv,
		File:        fileSrv,
		Git:         gitSrv,
		Docker:      dockerSrv,
		HostManager: hostSrv,
	}, nil
}

func (a *App) Close() error {
	if err := a.File.Close(); err != nil {
		return fmt.Errorf("failed to close file service: %w", err)
	}
	if err := a.Docker.Close(); err != nil {
		return fmt.Errorf("failed to close docker service: %w", err)
	}
	return nil
}

func (a *App) registerRoutes(mux *http.ServeMux) {
	connectAuth := connect.WithInterceptors()
	if a.Config.Auth {
		connectAuth = connect.WithInterceptors(auth.NewInterceptor(a.Auth))
	}

	handlers := []func() (string, http.Handler){
		// auth
		func() (string, http.Handler) {
			return authrpc.NewAuthServiceHandler(auth.NewConnectHandler(a.Auth))
		},
		// files
		func() (string, http.Handler) {
			return filesrpc.NewFileServiceHandler(files.NewConnectHandler(a.File), connectAuth)
		},
		func() (string, http.Handler) {
			return a.registerHttpHandler("/api/file", files.NewFileHandler(a.File))
		},
		// docker
		func() (string, http.Handler) {
			return dockerpc.NewDockerServiceHandler(docker.NewConnectHandler(a.Docker), connectAuth)
		},
		// git
		func() (string, http.Handler) {
			return gitrpc.NewGitServiceHandler(git.NewConnectHandler(a.Git), connectAuth)
		},
		func() (string, http.Handler) {
			return a.registerHttpHandler("/api/git", git.NewFileHandler(a.Git))
		},
		func() (string, http.Handler) {
			return a.registerHttpHandler("/auth/ping", http.HandlerFunc(
				func(w http.ResponseWriter, r *http.Request) {
					if _, err := w.Write([]byte("pong")); err != nil {
						return
					}
				}),
			)
		},
		// host_manager
		func() (string, http.Handler) {
			return hostrpc.NewHostManagerServiceHandler(hm.NewConnectHandler(a.HostManager), connectAuth)
		},
		// lsp
		func() (string, http.Handler) {
			wsFunc := lsp.WebSocketHandler(lsp.DefaultUpgrader)
			return a.registerHttpHandler("/lsp", wsFunc)
		},
	}

	for _, hand := range handlers {
		path, handler := hand()
		mux.Handle(path, handler)
	}
}

func (a *App) registerHttpHandler(basePath string, subMux http.Handler) (string, http.Handler) {
	if !strings.HasSuffix(basePath, "/") {
		basePath = basePath + "/"
	}

	baseHandler := http.StripPrefix(strings.TrimSuffix(basePath, "/"), subMux)
	if a.Config.Auth {
		httpAuth := auth.NewHttpAuthMiddleware(a.Auth)
		baseHandler = httpAuth(baseHandler)
	}

	return basePath, baseHandler
}
