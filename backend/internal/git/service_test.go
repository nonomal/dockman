package git

import (
	"fmt"
	"github.com/RA341/dockman/internal/files"
	"github.com/stretchr/testify/require"
	"math/rand"
	"path/filepath"
	"testing"
)

func TestService(t *testing.T) {
	root := "gitTest"
	abs, err := filepath.Abs(root)
	require.NoError(t, err)
	root = abs
	fil := files.NewService(root)
	git := NewService(root, fil.Fdb)

	t.Cleanup(func() {
		//err := fil.Close()
		//require.NoError(t, err)
		//err = os.RemoveAll(root)
		//require.NoError(t, err)
	})

	result := GenerateFileHierarchy(3, 2)
	for parent, child := range result {
		err := fil.Create(parent, "")
		require.NoError(t, err)
		for _, c := range child {
			err := fil.Create(c, parent)
			require.NoError(t, err)
		}
	}

	err = git.Commit("tracking dockman db", ".dockman.db")
	require.NoError(t, err)

	for parent := range result {
		err := git.CommitFileGroup("test-commit", parent)
		require.NoError(t, err)
	}
}

var (
	adjectives = []string{"autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark"}
	nouns      = []string{"waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning"}
	extensions = []string{".txt", ".md", ".log", ".json", ".dat", ".config"}
)

// generateRandomFileName creates a unique, random file name.
// It ensures the generated name is not already present in the 'existingNames' map.
func generateRandomFileName(existingNames map[string]bool) string {
	for {
		adj := adjectives[rand.Intn(len(adjectives))]
		noun := nouns[rand.Intn(len(nouns))]
		ext := extensions[rand.Intn(len(extensions))]
		num := rand.Intn(1000)

		fileName := fmt.Sprintf("%s-%s-%d%s", adj, noun, num, ext)

		if !existingNames[fileName] {
			return fileName
		}
	}
}

// GenerateFileHierarchy creates a map of parent files to their children.
// nParents: The number of parent files to generate.
// nChildren: The number of child files for each parent.
func GenerateFileHierarchy(nParents, nChildren int) map[string][]string {
	hierarchy := make(map[string][]string)
	allNames := make(map[string]bool)

	for i := 0; i < nParents; i++ {
		parentName := generateRandomFileName(allNames)
		allNames[parentName] = true

		children := make([]string, nChildren)
		for j := 0; j < nChildren; j++ {

			childName := generateRandomFileName(allNames)
			allNames[childName] = true
			children[j] = childName
		}

		hierarchy[parentName] = children
	}

	return hierarchy
}
