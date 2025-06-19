package cmd

import (
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
	"strings"
)

type ServerConfig struct {
	Port                 int
	AllowedOrigins       []string
	allowedOriginsString string // hide this when printing config
	ComposeRoot          string
	UIPath               string
	uiHandler            http.Handler // hide this when printing config
	Auth                 bool
}

type ServerOpt func(o *ServerConfig)

func parseConfig(opts ...ServerOpt) *ServerConfig {
	config := &ServerConfig{}
	for _, o := range opts {
		o(config)
	}
	// final checks
	if config.uiHandler == nil {
		WithUIPath(config.UIPath)(config)
	}
	if len(config.AllowedOrigins) == 0 {
		WithOrigins(config.allowedOriginsString)(config)
	}

	log.Info().Any("config", config).Msg("loaded config")
	return config
}

// WithOrigins expects a csv of origins
func WithOrigins(origins string) ServerOpt {
	elems := strings.Split(origins, ",")
	return func(o *ServerConfig) {
		o.AllowedOrigins = append(o.AllowedOrigins, elems...)
	}
}

// WithConfig overwrite current config with conf
func WithConfig(conf *ServerConfig) ServerOpt {
	return func(o *ServerConfig) {
		*o = *conf
	}
}

func WithUIPath(path string) ServerOpt {
	handler := loadUiHandler(path)
	return func(o *ServerConfig) {
		o.uiHandler = handler
	}
}

func loadUiHandler(path string) http.Handler {
	root, err := os.OpenRoot(path)
	if err != nil {
		log.Fatal().Err(err).Str("path", path).Msg("failed to open file for UI")
	}
	handler := http.FileServer(http.FS(root.FS()))
	return handler
}

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
