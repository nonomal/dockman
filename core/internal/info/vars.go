package info

import (
	"runtime"
)

const (
	DevMode = "dev"
)

var (
	Flavour    = "Server"
	Version    = DevMode
	CommitInfo = "unknown"
	BuildDate  = "unknown"
	Branch     = "unknown"
	GoVersion  = runtime.Version()
)

func IsDocker() bool {
	return Flavour == "Docker"
}

func IsDev() bool {
	return Version == DevMode
}
