package config

import (
	"flag"
	"fmt"
	"os"
	"strconv"
)

func denv(envName string) string {
	const base = "DOCKMAN"
	return fmt.Sprintf("%s_%s", base, envName)
}

// loadConfigFromArgs loads configuration from defaults, environment variables,
// and command-line arguments.
func loadConfigFromArgs() *AppConfig {
	conf := &AppConfig{}

	uiPathFromEnv := getEnv(denv("UI_PATH"), "dist")
	composeRootFromEnv := getEnv(denv("COMPOSE_ROOT"), "compose")
	authEnabledFromEnv := getEnvAsBool(denv("AUTH_ENABLE"), false)
	originsFromEnv := getEnv(denv("ORIGINS"), "*")
	localAddrFromEnv := getEnv(denv("MACHINE_ADDR"), "0.0.0.0")

	flag.StringVar(
		&conf.UIPath,
		"ui",
		uiPathFromEnv,
		"Path to frontend files.",
	)

	flag.StringVar(
		&conf.LocalAddr,
		"ma",
		localAddrFromEnv,
		"Local IP address of the machine running dockman: e.g 192.168.1.23",
	)

	flag.StringVar(
		&conf.AllowedOrigins,
		"origins",
		originsFromEnv,
		"configure allowed origins for the api, expects a csv of origins. eg. example.com,localhost:8080",
	)

	flag.StringVar(
		&conf.ComposeRoot,
		"cr",
		composeRootFromEnv,
		"Root directory for compose files.",
	)

	flag.BoolVar(
		&conf.Auth,
		"auth",
		authEnabledFromEnv,
		"Enable authentication.",
	)

	flag.Parse()
	return conf
}

// getEnv gets a key from environment variables or returns a fallback value.
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// getEnvAsBool gets a key from environment variables, parses it as a boolean,
// or returns a fallback value.
func getEnvAsBool(key string, fallback bool) bool {
	if value, ok := os.LookupEnv(key); ok {
		if b, err := strconv.ParseBool(value); err == nil {
			return b
		}
	}
	return fallback
}
