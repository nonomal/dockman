package config

import (
	"embed"
	"flag"
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/RA341/dockman/pkg/args"
	"github.com/rs/zerolog/log"
	"io/fs"
	"net"
	"os"
	"strings"
)

const envPrefix = "DOCKMAN"

var C *AppConfig

// AppConfig tags are parsed by processStruct
type AppConfig struct {
	Port           int    `config:"flag=port,env=PORT,default=8866,usage=Port to run the server on"`
	AllowedOrigins string `config:"flag=origins,env=ORIGINS,default=*,usage=Allowed origins for the API (in CSV)"`
	ComposeRoot    string `config:"flag=cr,env=COMPOSE_ROOT,default=compose,usage=Root directory for compose files"`
	UIPath         string `config:"flag=ui,env=UI_PATH,default=dist,usage=Path to frontend files"`
	Auth           bool   `config:"flag=auth,env=AUTH_ENABLE,default=false,usage=Enable authentication"`
	AuthUsername   string `config:"flag=au,env=AUTH_USERNAME,default=admin,usage=authentication username"`
	AuthPassword   string `config:"flag=ap,env=AUTH_PASSWORD,default=admin99988,usage=authentication password,hide=true"`
	LocalAddr      string `config:"flag=ma,env=MACHINE_ADDR,default=0.0.0.0,usage=Local machine IP address"`
	UpdaterAddr    string `config:"flag=upAddr,env=UPDATER_HOST,default=updater:8869,usage=Host address for dockman updater, eg: http://localhost:8869"`
	UpdaterKey     string `config:"flag=upAuth,env=UPDATER_KEY,default=,usage=Authentication key for dockman updater"`
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

// LoadConfig sets global app config
func LoadConfig(opts ...ServerOpt) {
	C = parseConfig(opts...)
}

// Load creates a new AppConfig, populates it from defaults, environment
// variables, and command-line flags, and then parses the flags.
// The order of precedence is:
// 1. Command-line flags (e.g., -port 9000)
// 2. Environment variables (e.g., DOCKMAN_PORT=9000)
// 3. Default values specified in struct tags.
func Load() (*AppConfig, error) {
	conf := &AppConfig{}
	if err := args.ProcessStruct(conf, envPrefix); err != nil {
		return nil, err
	}
	flag.Parse()
	return conf, nil
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
	args.PrettyPrint(config, envPrefix)

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
