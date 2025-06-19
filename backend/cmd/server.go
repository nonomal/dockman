package cmd

import (
	connectcors "connectrpc.com/cors"
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"net/http"
)

func StartServer(opt ...ServerOpt) {
	config := &ServerConfig{}
	for _, o := range opt {
		o(config)
	}
	log.Info().Any("config", config).Msg("loaded config")

	router := http.NewServeMux()

	app, err := NewApp(config)
	if err != nil {
		log.Fatal().Err(err).Msg("failed setting up app")
	}
	defer pkg.CloseFile(app)

	app.registerRoutes(router)
	router.Handle("/", config.uiHandler)

	middleware := cors.New(cors.Options{
		AllowedOrigins:      []string{"*"}, // todo load from env
		AllowPrivateNetwork: true,
		AllowedMethods:      connectcors.AllowedMethods(),
		AllowedHeaders:      append(connectcors.AllowedHeaders(), "Authorization"),
		ExposedHeaders:      connectcors.ExposedHeaders(),
	})
	finalMux := middleware.Handler(router)

	log.Info().Int("port", config.Port).Msg("Starting server...")
	err = http.ListenAndServe(
		fmt.Sprintf(":%d", config.Port),
		h2c.NewHandler(finalMux, &http2.Server{}),
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
