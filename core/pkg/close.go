package pkg

import (
	"github.com/rs/zerolog/log"
	"io"
)

func CloseFile(rw io.Closer) {
	err := rw.Close()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to close io.Closer")
	}
}
