package cmd

import (
	"github.com/rs/zerolog/log"
	"io/fs"
	"strings"
)

type ServerConfig struct {
	Port                 int
	AllowedOrigins       []string
	allowedOriginsString string // hide this when printing config
	ComposeRoot          string
	UIPath               string
	uiFS                 fs.FS // hide this when printing config
	Auth                 bool
}

type ServerOpt func(o *ServerConfig)

func parseConfig(opts ...ServerOpt) *ServerConfig {
	config := &ServerConfig{}
	for _, o := range opts {
		o(config)
	}
	// final checks
	if config.uiFS == nil {
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
	handler := LoadFileUI(path)
	return func(o *ServerConfig) {
		o.uiFS = handler
	}
}

func WithPort(port int) ServerOpt {
	return func(o *ServerConfig) {
		o.Port = port
	}
}

func WithUI(handler fs.FS) ServerOpt {
	return func(o *ServerConfig) {
		o.uiFS = handler
	}
}

func WithComposeRoot(compose string) ServerOpt {
	return func(o *ServerConfig) {
		o.ComposeRoot = compose
	}
}
