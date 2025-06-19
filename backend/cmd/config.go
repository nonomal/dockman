package cmd

import "net/http"

type ServerConfig struct {
	Port        int
	ComposeRoot string
	uiHandler   http.Handler
	auth        bool
}

type ServerOpt func(o *ServerConfig)

func WithAuth(enable bool) ServerOpt {
	return func(o *ServerConfig) {
		o.auth = enable
	}
}

func WithPort(port int) ServerOpt {
	return func(o *ServerConfig) {
		o.Port = port
	}
}

func WithUI(handler http.Handler) ServerOpt {
	return func(o *ServerConfig) {
		o.uiHandler = handler
	}
}

func WithComposeRoot(compose string) ServerOpt {
	return func(o *ServerConfig) {
		o.ComposeRoot = compose
	}
}
