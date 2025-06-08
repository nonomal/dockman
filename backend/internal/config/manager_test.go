package config

import (
	"github.com/stretchr/testify/require"
	"os"
	"testing"
)

func TestWrite(t *testing.T) {
	conf, err := Load("")
	require.NoError(t, err)
	require.NotNil(t, conf.FileManager.Files)
	t.Cleanup(func() {
		t.Logf("Cleaning up, removing file: %s", conf.configFilename)
		err := os.Remove(conf.configFilename)
		if err != nil && !os.IsNotExist(err) {
			t.Errorf("Failed to clean up file: %v", err)
		}
	})

	require.NoError(t, conf.FileManager.Insert("test.yaml"))
	require.NoError(t, conf.FileManager.Insert("test2.yaml/config.env"))
	require.NoError(t, conf.FileManager.Insert("test3.yaml"))
	require.NoError(t, conf.FileManager.Insert("test4.yaml/config22.env"))
	require.NoError(t, conf.Write())

	conf2, err := Load("")
	require.NoError(t, err)
	require.NotNil(t, conf.FileManager.Files)

	require.Equal(t, conf.FileManager.Files, conf2.FileManager.Files)
}
