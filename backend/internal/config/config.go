package config

import (
	"embed"
	"encoding/json"
	"fmt"
	"github.com/rs/zerolog/log"
	"io/fs"
	"os"
	"strings"
)

var C *AppConfig

type AppConfig struct {
	Port           int
	AllowedOrigins string
	ComposeRoot    string
	UIPath         string
	uiFS           fs.FS // hide this when printing config
	Auth           bool
	LocalAddr      string
}

func (c *AppConfig) GetUIFS() fs.FS {
	return c.uiFS
}

func (c *AppConfig) GetAllowedOrigins() []string {
	elems := strings.Split(c.AllowedOrigins, ",")
	for i := range elems {
		elems[i] = strings.TrimSpace(elems[i])
	}
	return elems
}

func (c *AppConfig) PrettyJSON() {
	b, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		log.Fatal().Err(err).Msg("Error marshalling config JSON")
	}
	fmt.Println(string(b))
}

// LoadConfig sets global app config
func LoadConfig(opts ...ServerOpt) {
	C = parseConfig(opts...)
}

func parseConfig(opts ...ServerOpt) *AppConfig {
	config := loadConfigFromArgs() // load args/envs
	for _, o := range opts {
		o(config)
	}

	loadDefaultIfNotSet(config)
	config.PrettyJSON()

	return config
}

// final checks
func loadDefaultIfNotSet(config *AppConfig) {
	if config.uiFS == nil {
		WithUIFromFile(config.UIPath)(config)
	}

	if len(strings.TrimSpace(config.AllowedOrigins)) == 0 {
		config.AllowedOrigins = "*" // allow all origins
	}

	if config.Port == 0 {
		config.Port = 8866
	}
}

type ServerOpt func(o *AppConfig)

// WithOrigins expects a csv of origins
func WithOrigins(origins string) ServerOpt {
	return func(o *AppConfig) {

	}
}

func WithUIFromFile(path string) ServerOpt {
	root, err := os.OpenRoot(path)
	if err != nil {
		log.Fatal().Err(err).Str("path", path).Msg("failed to open file for UI")
	}

	return func(o *AppConfig) {
		o.uiFS = root.FS()
	}
}

func WithUIFromEmbedded(uiFs embed.FS) ServerOpt {
	log.Debug().Msg("Loading frontend from embedded FS")
	subFS, err := fs.Sub(uiFs, "dist")
	if err != nil {
		log.Fatal().Err(err).Msg("failed to setup frontend fs")
	}

	return func(o *AppConfig) {
		o.uiFS = subFS
	}
}
