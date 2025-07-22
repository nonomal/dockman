package fileutil

import (
	"errors"
	"github.com/rs/zerolog/log"
	"io"
	"os"
)

func FileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}

func Close(rw io.Closer) {
	err := rw.Close()
	if err != nil && !errors.Is(err, io.EOF) {
		log.Warn().Err(err).Msg("Error occurred while closing io.Closer")
	}
}
