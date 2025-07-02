package docker

import (
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/compose/v2/pkg/api"
	"io"
	"os"
)

type ComposeConfig struct {
	dockerHost    string
	outputStream  io.Writer
	inputStream   io.ReadCloser
	allowFileSync bool
	project       *types.Project
	cli           api.Service
}

type Opts func(opt *ComposeConfig)

func parseOpts(opts ...Opts) *ComposeConfig {
	options := &ComposeConfig{}
	for _, opt := range opts {
		opt(options)
	}

	if options.outputStream == nil {
		options.outputStream = os.Stdout
	}

	return options
}

// WithFileSync allow file sync with remote host
func WithFileSync() Opts {
	return func(opt *ComposeConfig) {
		opt.allowFileSync = true
	}
}

func WithProjectAndCli(proj *types.Project, cli api.Service) Opts {
	return func(opt *ComposeConfig) {
		opt.project = proj
		opt.cli = cli
	}
}

func WithHost(host string) Opts {
	return func(opt *ComposeConfig) {
		opt.dockerHost = host
	}
}

func WithOutput(writer io.Writer) Opts {
	return func(opt *ComposeConfig) {
		opt.outputStream = writer
	}
}
func WithInput(reader io.ReadCloser) Opts {
	return func(opt *ComposeConfig) {
		opt.inputStream = reader
	}
}
