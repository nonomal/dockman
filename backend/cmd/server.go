package cmd

import (
	connectcors "connectrpc.com/cors"
	"fmt"
	"github.com/RA341/dockman/generated/compose/v1/v1connect"
	"github.com/RA341/dockman/internal/compose"
	"github.com/RA341/dockman/internal/git"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
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

	registerHandlers(router, config)
	router.Handle("/", config.uiHandler)

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
		loggingMiddleware(
			middleware.Handler(
				h2c.NewHandler(router, &http2.Server{}),
			),
		),
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

func registerHandlers(mux *http.ServeMux, config *ServerConfig) {
	services := initServices(config)

	endpoints := []func() (string, http.Handler){
		func() (string, http.Handler) {
			return v1connect.NewComposeServiceHandler(compose.NewHandler(services.compose))
		},
		func() (string, http.Handler) {
			return compose.NewFileHandler(services.compose).RegisterHandler()
		},
	}

	for _, svc := range endpoints {
		path, handler := svc()
		mux.Handle(path, handler)
	}

}
func loggingMiddleware(next http.Handler) http.Handler {
	return next
	//return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	//	//log.Debug().Str("method", r.Method).Str("path", r.URL.Path).Msg("Serving request")
	//	next.ServeHTTP(w, r)
	//})
}

type AllServices struct {
	compose *compose.Service
	git     *git.Service
}

func initServices(conf *ServerConfig) *AllServices {
	composeRoot := strings.TrimSpace(conf.ComposeRoot)
	comp := compose.NewService(composeRoot)
	gitMan := git.New(composeRoot)

	return &AllServices{
		compose: comp,
		git:     gitMan,
	}
}
