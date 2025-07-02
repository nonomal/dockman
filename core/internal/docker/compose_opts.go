package docker

import (
	"io"
	"os"
)

type ComposeConfig struct {
	dockerHost    string
	outputStream  io.Writer
	inputStream   io.ReadCloser
	allowFileSync bool
}

type Opts func(opt *ComposeConfig)

// WithFileSync allow file sync with remote host
func WithFileSync() Opts {
	return func(opt *ComposeConfig) {
		opt.allowFileSync = true
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
