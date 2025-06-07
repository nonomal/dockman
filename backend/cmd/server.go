package cmd

import (
	connectcors "connectrpc.com/cors"
	"fmt"
	"github.com/RA341/dockman/backend/generated/compose/v1/v1connect"
	"github.com/RA341/dockman/backend/internal/compose"
	"github.com/RA341/dockman/backend/internal/git"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"net/http"
)

type ServerConfig struct {
	Port      int
	UIHandler http.Handler
}

type ServerOpt func(o *ServerConfig)

func WithPort(port int) ServerOpt {
	return func(o *ServerConfig) {
		o.Port = port
	}
}

func WithUI(handler http.Handler) ServerOpt {
	return func(o *ServerConfig) {
		o.UIHandler = handler
	}
}

func StartServer(opt ...ServerOpt) {
	config := &ServerConfig{}
	for _, o := range opt {
		o(config)
	}

	router := http.NewServeMux()

	// todo
	//authInterceptor := connect.WithInterceptors(newAuthInterceptor())

	registerHandlers(router)
	router.Handle("/", config.UIHandler)

	middleware := cors.New(cors.Options{
		AllowedOrigins:      []string{"*"},
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

func registerHandlers(mux *http.ServeMux) {
	services := initServices()

	endpoints := []func() (string, http.Handler){
		func() (string, http.Handler) {
			return v1connect.NewComposeServiceHandler(compose.NewHandler(services.compose))
		},
	}

	for _, svc := range endpoints {
		path, handler := svc()
		mux.Handle(path, handler)
	}
}

type AllServices struct {
	compose *compose.Service
	git     *git.Service
}

func initServices() *AllServices {
	composeRoot := "compose"

	comp := compose.New(composeRoot)
	gitMan := git.New(composeRoot)

	return &AllServices{
		compose: comp,
		git:     gitMan,
	}
}
