package git

import (
	"fmt"
	"github.com/RA341/dockman/internal/files"
	"github.com/RA341/dockman/pkg/logger"
	"github.com/go-git/go-git/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"math/rand"
	"os"
	"path/filepath"
	"testing"
)

func init() {
	logger.InitForTest()
}

func TestImportSync(t *testing.T) {
	// create test repo

	// write 2 files test.txt test2.txt

	// commit and save

	// assert 2
}

func Test_DUMB(t *testing.T) {
	_ = NewService("./git_test")
}

func createTestRepo(t *testing.T, repoPath string) (*git.Repository, *Service) {
	//file := files.NewService(repoPath)
	srv := NewService(repoPath)

	createAndWriteFile(t, repoPath, "README.md", "# Test Repository")

	err := srv.Commit("Initial commit", "README.md")
	require.NoError(t, err)

	return srv.repo, srv
}

func createAndWriteFile(t *testing.T, repoPath, filename, content string) {
	fullPath := filepath.Join(repoPath, filename)

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	err := os.MkdirAll(dir, 0755)
	require.NoError(t, err)

	err = os.WriteFile(fullPath, []byte(content), 0644)
	require.NoError(t, err)
}

// Benchmark test
func BenchmarkService_Commit(b *testing.B) {
	// Create temporary directory
	tempDir, err := os.MkdirTemp("", "git-bench-*")
	require.NoError(b, err)
	defer os.RemoveAll(tempDir)

	// Setup repository
	repo, _ := createTestRepo(&testing.T{}, tempDir)
	service := &Service{repo: repo}

	// Create test files
	for i := 0; i < 10; i++ {
		filename := fmt.Sprintf("file%d.txt", i)
		createAndWriteFile(&testing.T{}, tempDir, filename, fmt.Sprintf("content %d", i))
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		// Use a different commit message for each iteration
		commitMsg := fmt.Sprintf("Benchmark commit %d", i)
		err := service.Commit(commitMsg, "file0.txt", "file1.txt")
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Test edge cases
func TestService_Commit_EdgeCases(t *testing.T) {
	t.Run("commit with very long message", func(t *testing.T) {
		tempDir, err := os.MkdirTemp("", "git-test-*")
		require.NoError(t, err)
		defer os.RemoveAll(tempDir)

		repo, _ := createTestRepo(t, tempDir)
		service := &Service{repo: repo}

		createAndWriteFile(t, tempDir, "test.txt", "content")

		longMessage := string(make([]byte, 1000)) // Very long commit message
		for i := range longMessage {
			longMessage = longMessage[:i] + "a" + longMessage[i+1:]
		}

		err = service.Commit(longMessage, "test.txt")
		assert.NoError(t, err)
	})

	t.Run("commit with special characters in filename", func(t *testing.T) {
		tempDir, err := os.MkdirTemp("", "git-test-*")
		require.NoError(t, err)
		defer os.RemoveAll(tempDir)

		repo, _ := createTestRepo(t, tempDir)
		service := &Service{repo: repo}

		specialFile := "file with spaces & symbols!.txt"
		createAndWriteFile(t, tempDir, specialFile, "special content")

		err = service.Commit("Add special file", specialFile)
		assert.NoError(t, err)
	})
}

func TestService(t *testing.T) {
	root := "gitTest"
	abs, err := filepath.Abs(root)
	require.NoError(t, err)
	root = abs
	fil := files.NewService(root)
	gitc := NewService(root)

	t.Cleanup(func() {
		//err := fil.Close()
		//require.NoError(t, err)
		//err = os.RemoveAll(root)
		//require.NoError(t, err)
	})

	result := GenerateFileHierarchy(3, 2)
	for parent, child := range result {
		err := fil.Create(parent)
		require.NoError(t, err)
		for _, c := range child {
			err := fil.Create(c)
			require.NoError(t, err)
		}
	}

	err = gitc.Commit("tracking dockman db", ".dockman.db")
	require.NoError(t, err)

	for parent := range result {
		err := gitc.CommitFileGroup("test-commit", parent)
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
