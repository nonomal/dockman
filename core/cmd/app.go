package cmd

import (
	"connectrpc.com/connect"
	"fmt"
	authrpc "github.com/RA341/dockman/generated/auth/v1/v1connect"
	dockerpc "github.com/RA341/dockman/generated/docker/v1/v1connect"
	dockermanagerrpc "github.com/RA341/dockman/generated/docker_manager/v1/v1connect"
	filesrpc "github.com/RA341/dockman/generated/files/v1/v1connect"
	gitrpc "github.com/RA341/dockman/generated/git/v1/v1connect"
	"github.com/RA341/dockman/internal/auth"
	"github.com/RA341/dockman/internal/config"
	"github.com/RA341/dockman/internal/docker"
	dm "github.com/RA341/dockman/internal/docker_manager"
	"github.com/RA341/dockman/internal/files"
	"github.com/RA341/dockman/internal/git"
	"github.com/RA341/dockman/internal/info"
	"github.com/RA341/dockman/internal/ssh"
	logger "github.com/RA341/dockman/pkg"
	"github.com/RA341/dockman/pkg/lsp"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
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
	HostManager *dm.Service
}

func NewApp(conf *config.AppConfig) (*App, error) {
	absComposeRoot, err := filepath.Abs(strings.TrimSpace(conf.ComposeRoot))
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path for compose root: %w", err)
	}

	configDir := "config"
	if err := os.MkdirAll(configDir, os.ModePerm); err != nil {
		log.Fatal().Err(err).Msg("unable to create config directory")
	}

	authSrv := auth.NewService()
	sshSrv := ssh.NewService(configDir)
	fileSrv := files.NewService(absComposeRoot)
	gitSrv := git.NewService(absComposeRoot)
	dockerManagerSrv := dm.NewService(gitSrv, sshSrv)
	dockerSrv := docker.NewService(
		absComposeRoot,
		dockerManagerSrv.Manager.GetClientFn(),
		dockerManagerSrv.Manager.GetSFTPFn(),
	)

	log.Info().Msg("Dockman initialized successfully")
	return &App{
		Config:      conf,
		Auth:        authSrv,
		File:        fileSrv,
		Git:         gitSrv,
		Docker:      dockerSrv,
		HostManager: dockerManagerSrv,
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
	globalInterceptor := connect.WithInterceptors()
	if a.Config.Auth {
		globalInterceptor = connect.WithInterceptors(auth.NewInterceptor(a.Auth))
	}

	handlers := []func() (string, http.Handler){
		// auth
		func() (string, http.Handler) {
			return authrpc.NewAuthServiceHandler(auth.NewConnectHandler(a.Auth))
		},
		// files
		func() (string, http.Handler) {
			return filesrpc.NewFileServiceHandler(files.NewConnectHandler(a.File), globalInterceptor)
		},
		func() (string, http.Handler) {
			return a.registerHttpHandler("/api/file", files.NewFileHandler(a.File))
		},
		// docker
		func() (string, http.Handler) {
			return dockerpc.NewDockerServiceHandler(docker.NewConnectHandler(a.Docker), globalInterceptor)
		},
		// git
		func() (string, http.Handler) {
			return gitrpc.NewGitServiceHandler(git.NewConnectHandler(a.Git), globalInterceptor)
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
			return dockermanagerrpc.NewDockerManagerServiceHandler(dm.NewConnectHandler(a.HostManager), globalInterceptor)
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
