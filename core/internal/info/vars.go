package info

import (
	"runtime"
)

// build args to modify vars
//
// -X github.com/RA341/dockman/internal/info.Version=${VERSION} \
// -X github.com/RA341/dockman/internal/info.CommitInfo=${COMMIT_INFO} \
// -X github.com/RA341/dockman/internal/info.BuildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
// -X github.com/RA341/dockman/internal/info.Branch=${BRANCH}" \
// cmd/server.go

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
