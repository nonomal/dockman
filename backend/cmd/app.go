package cmd

import (
	"connectrpc.com/connect"
	"fmt"
	authrpc "github.com/RA341/dockman/generated/auth/v1/v1connect"
	dockerpc "github.com/RA341/dockman/generated/docker/v1/v1connect"
	filesrpc "github.com/RA341/dockman/generated/files/v1/v1connect"
	gitrpc "github.com/RA341/dockman/generated/git/v1/v1connect"
	"github.com/RA341/dockman/internal/auth"
	"github.com/RA341/dockman/internal/docker"
	"github.com/RA341/dockman/internal/files"
	"github.com/RA341/dockman/internal/git"
	"net/http"
	"path/filepath"
	"strings"
)

type App struct {
	Config *ServerConfig
	Auth   *auth.Service
	File   *files.Service
	Git    *git.Service
	Docker *docker.Service
}

// NewApp creates and initializes a new App instance with all its dependencies.
func NewApp(conf *ServerConfig) (*App, error) {
	absComposeRoot, err := filepath.Abs(strings.TrimSpace(conf.ComposeRoot))
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path for compose root: %w", err)
	}

	authSrv := auth.NewService()
	fileSrv := files.NewService(absComposeRoot)
	gitSrv := git.NewService(absComposeRoot, fileSrv.Fdb)
	dockerSrv := docker.NewService(absComposeRoot)

	return &App{
		Config: conf,
		Auth:   authSrv,
		File:   fileSrv,
		Git:    gitSrv,
		Docker: dockerSrv,
	}, nil
}

// Close gracefully shuts down the application's services.
func (a *App) Close() error {
	if err := a.File.Close(); err != nil {
		return fmt.Errorf("failed to close file service: %w", err)
	}
	if err := a.Docker.Close(); err != nil {
		return fmt.Errorf("failed to close docker service: %w", err)
	}
	return nil
}

// registerRoutes sets up all the HTTP handlers for the application.
func (a *App) registerRoutes(mux *http.ServeMux) {
	connectAuth := connect.WithInterceptors()
	if a.Config.auth {
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
	if a.Config.auth {
		httpAuth := auth.NewHttpAuthMiddleware(a.Auth)
		baseHandler = httpAuth(baseHandler)
	}

	return basePath, baseHandler
}
