package info

import (
	"runtime"
)

var (
	Flavour    = "Server"
	Version    = "dev"
	CommitInfo = "unknown"
	BuildDate  = "unknown"
	Branch     = "unknown"
	GoVersion  = runtime.Version()
)

func IsDocker() bool {
	return Flavour == "Docker"
}
