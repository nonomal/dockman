package compose

import (
	"github.com/stretchr/testify/require"
	"os"
	"testing"
)

func TestWrite(t *testing.T) {
	writer := NewManager("")
	require.NotNil(t, writer.files)
	t.Cleanup(func() {
		t.Logf("Cleaning up, removing file: %s", writer.configPath)
		err := os.Remove(writer.configPath)
		if err != nil && !os.IsNotExist(err) {
			t.Errorf("Failed to clean up file: %v", err)
		}
	})

	require.NoError(t, writer.Insert("test.yaml", ""))
	require.NoError(t, writer.Insert("test2.yaml/config.env", ""))
	require.NoError(t, writer.Insert("test2.yaml/some.yaml", ""))
	require.NoError(t, writer.Insert("test3.yaml", ""))
	require.NoError(t, writer.Insert("test4.yaml/config22.env", ""))
	require.NoError(t, writer.Write())

	//conf2 := NewManager("")
	//require.Equal(t, writer.fa.Files, conf2.fa.Files)
}
