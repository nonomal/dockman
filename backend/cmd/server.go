package cmd

import (
	"fmt"
	"github.com/rs/zerolog/log"
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

	http.Handle("/", config.UIHandler)

	err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), nil)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
