package files

import (
	"github.com/stretchr/testify/require"
	"os"
	"testing"
)

func TestBolt(t *testing.T) {
	conf := NewBoltConfig("")
	t.Cleanup(func() {
		err := conf.Close()
		require.NoError(t, err)

		err = os.RemoveAll(boltFileDBName)
		require.NoError(t, err)
	})

	parent := "parent.txt"
	err := conf.Insert(parent, "")
	require.NoError(t, err)

	err = conf.Insert(parent, "")
	require.Error(t, err, "file already exists")

	test := "test.yaml"
	err = conf.Insert(test, parent)
	require.NoError(t, err)

	test2 := "test3.yaml"
	err = conf.Insert(test2, "unknownparent.ss")
	require.Error(t, err, "parent file does not exist")

	err = conf.Delete(parent)
	require.NoError(t, err)

	boolVal, err := conf.Exists(parent)
	require.NoError(t, err)
	require.Equal(t, false, boolVal)
}
