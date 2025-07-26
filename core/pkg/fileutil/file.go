package fileutil

import (
	"errors"
	"fmt"
	"github.com/rs/zerolog/log"
	"io"
	"os"
)

func CreateSampleFile(filepath, content string) error {
	file, err := OpenFile(filepath)
	if err != nil {
		return fmt.Errorf("error creating dummy file: %s", err)
	}
	defer Close(file)

	_, err = file.Write([]byte(content))
	if err != nil {
		return fmt.Errorf("error writing dummy file: %s", err)
	}

	return nil
}

func OpenFile(filename string) (*os.File, error) {
	return os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
}

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
