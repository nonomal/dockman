package pkg

import (
	"github.com/rs/zerolog/log"
	"io"
	"os"
)

func FileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}

func CloseCloser(rw io.Closer) {
	err := rw.Close()
	if err != nil {
		log.Warn().Err(err).Msg("Error occurred while closing io.Closer")
	}
}
