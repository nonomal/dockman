package config

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"math/rand"
	"testing"
)

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

// generateRandomFilename creates a random string of a given length and appends an extension.
// For example, generateRandomFilename(8, ".log") might return "aK3pL9vD.log".
func generateRandomFilename(length int, extension string) string {
	b := make([]rune, length)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b) + extension
}

func generateMockConf(t *testing.T, n int) *FileManager {
	var config = NewFileManager()
	for i := 0; i < n; i++ {
		name := generateRandomFilename(8, ".yaml")

		err := config.Insert(name)
		require.NoError(t, err)

		subfiles := rand.Intn(8)
		for j := 0; j < subfiles; j++ {
			subName := generateRandomFilename(8, ".env")
			err := config.Insert(fmt.Sprintf("%s/%s", name, subName))
			require.NoError(t, err)
		}
	}

	return config
}

func TestFileManager_Rename(t *testing.T) {
	man := NewFileManager()
	oldName := "oldname/nema.txt"
	mustInsert(t, man, oldName)

	newName := "newname/nema.txt"
	err := man.Rename(oldName, newName)
	require.NoError(t, err)

	checkExistence(t, newName, man)
	oldParent, _ := mustDecode(t, oldName)
	_, err = man.GetParent(oldParent)
	require.ErrorIs(t, err, ErrGroupNotExists)

	renamedChild := "newname/nema2.txt"
	require.NoError(t, man.Rename(newName, renamedChild))

	expectedChild, err := man.GetChild(renamedChild)
	require.NoError(t, err)

	_, actualChild := mustDecode(t, renamedChild)
	assert.Equal(t, expectedChild, actualChild)
}

var testCases = []string{
	"newtest",
	"mew/sspd",
	"ssos",
	"asssss",
}

func FuzzFileManager_Insert(f *testing.F) {
	man := NewFileManager()
	for _, tc := range testCases {
		f.Add(tc)
	}

	f.Fuzz(func(t *testing.T, orig string) {
		checkExistence(t, orig, man)
	})
}

func TestFileManager_Insert(t *testing.T) {
	man := NewFileManager()
	for _, testCase := range testCases {
		t.Logf("testing %s", testCase)
		checkExistence(t, testCase, man)
	}

	require.ErrorIs(t, man.Insert("mew/ssd/ssdasd/asdasd"), ErrFileAddrDecode)
	require.ErrorIs(t, man.Insert("mew///sspd"), ErrFileAddrDecode)
	require.ErrorIs(t, man.Insert("/"), ErrFileAddrDecode)
	require.ErrorIs(t, man.Insert(""), ErrFileAddrDecode)
}

func checkExistence(t *testing.T, testCase string, man *FileManager) {
	parent, child := mustDecode(t, testCase)

	err := man.Insert(testCase)
	require.NoError(t, err)
	require.NotNil(t, man.Files[parent])

	if child != "" {
		_, ok := man.Files[parent].SubFiles[child]
		require.Equal(t, true, ok)
	}
}

func mustDecode(t *testing.T, testCase string) (string, string) {
	parent, child, err := decodeFileNames(testCase)
	require.NoError(t, err)
	return parent, child
}

func mustInsert(t *testing.T, man *FileManager, name string) {
	err := man.Insert(name)
	require.NoError(t, err)
}
