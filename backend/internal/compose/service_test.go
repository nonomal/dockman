package compose

import (
	"github.com/stretchr/testify/require"
	"path/filepath"
	"testing"
)

func TestService_Create(t *testing.T) {
	baseFolder := "test-compose"
	srv := NewService(baseFolder)
	require.FileExists(t, filepath.Join(baseFolder, dockManConfFileName))

	parent := "test2.yaml"
	err := srv.Create(parent, "")
	require.NoError(t, err)
	require.FileExists(t, filepath.Join(baseFolder, parent))

	child := "child.txt"
	err = srv.Create(child, parent)
	require.NoError(t, err)
	require.FileExists(t, filepath.Join(baseFolder, child))

	gotParent, ok := srv.man.GetVal(child)
	require.Equal(t, ok, true)
	require.Equal(t, parent, gotParent)

	// duplicate
	err = srv.Create(parent, "")
	require.Error(t, err, "")
}
