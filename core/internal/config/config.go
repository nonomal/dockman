package config

import (
	"embed"
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/rs/zerolog/log"
	"io/fs"
	"net"
	"os"
	"reflect"
	"strings"
)

var C *AppConfig

// AppConfig tags are parsed by processStruct
type AppConfig struct {
	Port           int    `config:"flag=port,env=PORT,default=8866,usage=Port to run the server on"`
	AllowedOrigins string `config:"flag=origins,env=ORIGINS,default=*,usage=Allowed origins for the API (CSV)"`
	ComposeRoot    string `config:"flag=cr,env=COMPOSE_ROOT,default=compose,usage=Root directory for compose files"`
	UIPath         string `config:"flag=ui,env=UI_PATH,default=dist,usage=Path to frontend files"`
	Auth           bool   `config:"flag=auth,env=AUTH_ENABLE,default=false,usage=Enable authentication"`
	AuthUsername   string `config:"flag=au,env=AUTH_USERNAME,default=admin,usage=authentication username"`
	AuthPassword   string `config:"flag=ap,env=AUTH_PASSWORD,default=admin99988,usage=authentication password,hide=true"`
	LocalAddr      string `config:"flag=ma,env=MACHINE_ADDR,default=0.0.0.0,usage=Local machine IP address"`
	UIFS           fs.FS  // UIFS has no 'config' tag, so it will be ignored
}

func (c *AppConfig) GetAllowedOrigins() []string {
	elems := strings.Split(c.AllowedOrigins, ",")
	for i := range elems {
		elems[i] = strings.TrimSpace(elems[i])
	}
	return elems
}

func (c *AppConfig) GetDockmanWithMachineUrl() string {
	return fmt.Sprintf("http://%s:%d", c.LocalAddr, c.Port)
}

func (c *AppConfig) PrettyPrint() {
	// Flatten the struct into a list of KeyValue pairs.
	// We start with an empty prefix for the top-level keys.
	pairs := flattenStruct(reflect.ValueOf(c), "")

	// Find the length of the longest key for alignment.
	maxKeyLength := 0
	maxValueLength := 0
	maxHelpLength := 0
	for _, p := range pairs {
		if len(p.Key) > maxKeyLength {
			maxKeyLength = len(p.Key)
		}

		// strip ANSI color codes to get the true visible length of the value.
		cleanValue := ansiRegex.ReplaceAllString(p.Value, "")
		if len(cleanValue) > maxValueLength {
			maxValueLength = len(cleanValue)
		}

		cleanHelpValue := ansiRegex.ReplaceAllString(p.HelpMessage, "")
		if len(cleanHelpValue) > maxHelpLength {
			maxHelpLength = len(cleanHelpValue)
		}
	}

	// Format each pair into a colored, aligned string.
	redEnvLabel := colorize("Env:", ColorRed+ColorUnderline)
	var contentBuilder strings.Builder
	for i, p := range pairs {
		// Calculate padding for the key column
		keyPadding := strings.Repeat(" ", maxKeyLength-len(p.Key))

		// Calculate padding for the value column
		cleanValue := ansiRegex.ReplaceAllString(p.Value, "")
		valuePadding := strings.Repeat(" ", maxValueLength-len(cleanValue))

		// Colorize parts for readability
		coloredKey := colorize(p.Key, ColorBlue+ColorBold)

		cleanHelp := ansiRegex.ReplaceAllString(p.HelpMessage, "")
		helpPadding := strings.Repeat(" ", maxHelpLength-len(cleanHelp))

		// Assemble the line with calculated padding
		// Format: [Key]:[Padding]  [Value][Padding]   [Help]
		contentBuilder.WriteString(coloredKey)
		contentBuilder.WriteString(":")
		contentBuilder.WriteString(keyPadding)
		contentBuilder.WriteString("  ") // Separator between key and value

		contentBuilder.WriteString(p.Value)
		contentBuilder.WriteString(valuePadding)
		contentBuilder.WriteString("  ") // Separator between value and help

		contentBuilder.WriteString(p.HelpMessage)
		contentBuilder.WriteString(helpPadding)
		contentBuilder.WriteString("  ") // Separator between help and env

		contentBuilder.WriteString(fmt.Sprintf("%s %s", redEnvLabel, p.EnvName))

		if i < len(pairs)-1 {
			contentBuilder.WriteString("\n")
		}
	}

	ms := colorize("To modify config, set the respective", ColorMagenta+ColorBold)
	contentBuilder.WriteString(fmt.Sprintf("\n\n%s %s", ms, redEnvLabel))

	printInBox("Config", contentBuilder.String())
}

// LoadConfig sets global app config
func LoadConfig(opts ...ServerOpt) {
	C = parseConfig(opts...)
}

func parseConfig(opts ...ServerOpt) *AppConfig {
	config, err := Load() // load args/envs
	if err != nil {
		log.Fatal().Err(err).Msg("Error parsing config")
	}

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

	if config.LocalAddr == "0.0.0.0" {
		ip, err := getLocalIP()
		if err == nil {
			config.LocalAddr = ip
		}
	}
}

func getLocalIP() (string, error) {
	log.Info().Msg("Getting local IP by pinging cloudflare")
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "", err
	}
	defer pkg.CloseFile(conn)

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String(), nil
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
