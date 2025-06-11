package cmd

import (
	connectcors "connectrpc.com/cors"
	"fmt"
	"github.com/RA341/dockman/generated/compose/v1/v1connect"
	"github.com/RA341/dockman/internal/files"
	"github.com/RA341/dockman/internal/git"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"io"
	"net/http"
	"strings"
)

type ServerConfig struct {
	Port        int
	ComposeRoot string
	uiHandler   http.Handler
}

type ServerOpt func(o *ServerConfig)

func WithPort(port int) ServerOpt {
	return func(o *ServerConfig) {
		o.Port = port
	}
}

func WithUI(handler http.Handler) ServerOpt {
	return func(o *ServerConfig) {
		o.uiHandler = handler
	}
}

func WithComposeRoot(compose string) ServerOpt {
	return func(o *ServerConfig) {
		o.ComposeRoot = compose
	}
}

func StartServer(opt ...ServerOpt) {
	config := &ServerConfig{}
	for _, o := range opt {
		o(config)
	}
	log.Info().Any("config", config).Msg("loaded config")

	router := http.NewServeMux()

	// todo
	//authInterceptor := connect.WithInterceptors(newAuthInterceptor())

	closers := registerHandlers(router, config)
	defer func() {
		if err := closers.Close(); err != nil {
			log.Warn().Err(err).Msg("error occurred while closing services")
		}
	}()

	router.Handle("/", config.uiHandler)

	middleware := cors.New(cors.Options{
		AllowedOrigins:      []string{"http://localhost:5173"}, // todo load from env
		AllowPrivateNetwork: true,
		AllowedMethods:      connectcors.AllowedMethods(),
		AllowedHeaders:      append(connectcors.AllowedHeaders(), "Authorization"),
		ExposedHeaders:      connectcors.ExposedHeaders(),
	})

	log.Info().Int("port", config.Port).Msg("Starting server on port")

	err := http.ListenAndServe(
		fmt.Sprintf(":%d", config.Port),
		middleware.Handler(h2c.NewHandler(router, &http2.Server{})),
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

func registerHandlers(mux *http.ServeMux, config *ServerConfig) io.Closer {
	services := initServices(config)

	endpoints := []func() (string, http.Handler){
		func() (string, http.Handler) {
			return v1connect.NewComposeServiceHandler(files.NewHandler(services.compose))
		},
		func() (string, http.Handler) {
			return files.NewFileHandler(services.compose).RegisterHandler()
		},
	}

	for _, svc := range endpoints {
		path, handler := svc()
		mux.Handle(path, handler)
	}

	return services
}

type AllServices struct {
	compose *files.Service
	git     *git.Service
}

func (a *AllServices) Close() error {
	if err := a.compose.Close(); err != nil {
		return err
	}
	return nil
}

func initServices(conf *ServerConfig) *AllServices {
	composeRoot := strings.TrimSpace(conf.ComposeRoot)
	comp := files.NewService(composeRoot)
	gitMan := git.New(composeRoot)

	return &AllServices{
		compose: comp,
		git:     gitMan,
	}
}
