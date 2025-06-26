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
	SourceHash = "unknown"
	GoVersion  = runtime.Version()
)
