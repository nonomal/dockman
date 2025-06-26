package config

import (
	"embed"
	"github.com/rs/zerolog/log"
	"io/fs"
	"os"
	"reflect"
	"strings"
)

var C *AppConfig

type AppConfig struct {
	Port           int
	AllowedOrigins string
	ComposeRoot    string
	UIPath         string
	UIFS           fs.FS `json:"-"`
	Auth           bool
	LocalAddr      string
}

func (c *AppConfig) GetAllowedOrigins() []string {
	elems := strings.Split(c.AllowedOrigins, ",")
	for i := range elems {
		elems[i] = strings.TrimSpace(elems[i])
	}
	return elems
}

func (c *AppConfig) PrettyPrint() {
	// Flatten the struct into a list of KeyValue pairs.
	// We start with an empty prefix for the top-level keys.
	pairs := flattenStruct(reflect.ValueOf(c), "")

	// Find the length of the longest key for alignment.
	maxKeyLength := 0
	for _, p := range pairs {
		if len(p.Key) > maxKeyLength {
			maxKeyLength = len(p.Key)
		}
	}

	// Format each pair into a colored, aligned string.
	var contentBuilder strings.Builder
	for i, p := range pairs {
		// Colorize the key and add padding
		coloredKey := colorize(p.Key, ColorBlue+ColorBold)
		padding := strings.Repeat(" ", maxKeyLength-len(p.Key))

		contentBuilder.WriteString(coloredKey)
		contentBuilder.WriteString(":  ")
		contentBuilder.WriteString(padding)
		contentBuilder.WriteString(p.Value) // Value is already colored

		if i < len(pairs)-1 {
			contentBuilder.WriteString("\n")
		}
	}

	printInBox("Config", contentBuilder.String())
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
	config.PrettyPrint()

	return config
}

// final checks
func loadDefaultIfNotSet(config *AppConfig) {
	if config.UIFS == nil {
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

func WithUIFromFile(path string) ServerOpt {
	root, err := os.OpenRoot(path)
	if err != nil {
		log.Fatal().Err(err).Str("path", path).Msg("failed to open file for UI")
	}

	return func(o *AppConfig) {
		o.UIFS = root.FS()
	}
}

func WithUIFromEmbedded(uiFs embed.FS) ServerOpt {
	log.Debug().Msg("Loading frontend from embedded FS")
	subFS, err := fs.Sub(uiFs, "dist")
	if err != nil {
		log.Fatal().Err(err).Msg("failed to setup frontend fs")
	}

	return func(o *AppConfig) {
		o.UIFS = subFS
	}
}
