package git

import (
	"fmt"
	"github.com/RA341/dockman/internal/files"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"math/rand"
	"os"
	"path/filepath"
	"testing"
	"time"
)

type CommitTestCase struct {
	name          string
	setupRepo     func(t *testing.T, repoPath string) (*git.Repository, *Service)
	commitMessage string
	fileList      []string
	wantErr       bool
	errContains   string
	validate      func(t *testing.T, repo *git.Repository, repoPath string)
}

func TestService_Commit(t *testing.T) {
	tests := []CommitTestCase{
		{
			name: "successful commit with single file",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				repo, srv := createTestRepo(t, repoPath)
				createAndWriteFile(t, repoPath, "test.txt", "hello world")
				return repo, srv
			},
			commitMessage: "Add test file",
			fileList:      []string{"test.txt"},
			wantErr:       false,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
				// Verify commit exists
				ref, err := repo.Head()
				require.NoError(t, err)

				commit, err := repo.CommitObject(ref.Hash())
				require.NoError(t, err)
				assert.Equal(t, "Add test file", commit.Message)

				// Verify file is in the commit
				tree, err := commit.Tree()
				require.NoError(t, err)

				_, err = tree.File("test.txt")
				assert.NoError(t, err)
			},
		},
		{
			name: "successful commit with multiple files",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				repo, srv := createTestRepo(t, repoPath)
				createAndWriteFile(t, repoPath, "file1.txt", "content1")
				createAndWriteFile(t, repoPath, "file2.txt", "content2")
				return repo, srv
			},
			commitMessage: "Add multiple files",
			fileList:      []string{"file1.txt", "file2.txt"},
			wantErr:       false,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
				ref, err := repo.Head()
				require.NoError(t, err)

				commit, err := repo.CommitObject(ref.Hash())
				require.NoError(t, err)

				tree, err := commit.Tree()
				require.NoError(t, err)

				_, err = tree.File("file1.txt")
				assert.NoError(t, err)

				_, err = tree.File("file2.txt")
				assert.NoError(t, err)
			},
		},
		{
			name: "skip ignored files and commit existing ones",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				repo, srv := createTestRepo(t, repoPath)

				// Create .gitignore
				createAndWriteFile(t, repoPath, ".gitignore", "ignored.txt\n")

				// Create files
				createAndWriteFile(t, repoPath, "normal.txt", "normal content")
				createAndWriteFile(t, repoPath, "ignored.txt", "ignored content")

				// Add and commit .gitignore first
				worktree, _ := repo.Worktree()
				worktree.Add(".gitignore")
				worktree.Commit("Add gitignore", &git.CommitOptions{
					Author: &object.Signature{
						Name:  "Test User",
						Email: "test@example.com",
						When:  time.Now(),
					},
				})

				return repo, srv
			},
			commitMessage: "Add files with ignored",
			fileList:      []string{"normal.txt", "ignored.txt"},
			wantErr:       false,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
				ref, err := repo.Head()
				require.NoError(t, err)

				commit, err := repo.CommitObject(ref.Hash())
				require.NoError(t, err)

				tree, err := commit.Tree()
				require.NoError(t, err)

				// Normal file should be committed
				_, err = tree.File("normal.txt")
				assert.NoError(t, err)

				// Ignored file should not be in this commit
				_, err = tree.File("ignored.txt")
				assert.Error(t, err)
			},
		},
		{
			name: "commit with non-existent file (should skip)",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				repo, srv := createTestRepo(t, repoPath)
				createAndWriteFile(t, repoPath, "exists.txt", "content")
				return repo, srv
			},
			commitMessage: "Commit with missing file",
			fileList:      []string{"exists.txt", "missing.txt"},
			wantErr:       false,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
				ref, err := repo.Head()
				require.NoError(t, err)

				commit, err := repo.CommitObject(ref.Hash())
				require.NoError(t, err)

				tree, err := commit.Tree()
				require.NoError(t, err)

				// Only existing file should be committed
				_, err = tree.File("exists.txt")
				assert.NoError(t, err)
			},
		},
		{
			name: "empty file list - should create empty commit",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				return createTestRepo(t, repoPath)
			},
			commitMessage: "Empty commit",
			fileList:      []string{},
			wantErr:       true,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
			},
		},
		{
			name: "commit files in subdirectory",
			setupRepo: func(t *testing.T, repoPath string) (*git.Repository, *Service) {
				repo, srv := createTestRepo(t, repoPath)

				// Create subdirectory and file
				subDir := filepath.Join(repoPath, "subdir")
				err := os.MkdirAll(subDir, 0755)
				require.NoError(t, err)

				createAndWriteFile(t, repoPath, "subdir/nested.txt", "nested content")
				return repo, srv
			},
			commitMessage: "Add nested file",
			fileList:      []string{"subdir/nested.txt"},
			wantErr:       false,
			validate: func(t *testing.T, repo *git.Repository, repoPath string) {
				ref, err := repo.Head()
				require.NoError(t, err)

				commit, err := repo.CommitObject(ref.Hash())
				require.NoError(t, err)

				tree, err := commit.Tree()
				require.NoError(t, err)

				_, err = tree.File("subdir/nested.txt")
				assert.NoError(t, err)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tempDir, err := os.MkdirTemp("", "git-test-*")
			require.NoError(t, err)
			defer func(path string) {
				err := os.RemoveAll(path)
				if err != nil {
					t.Logf("failed to remove temp dir: %s, %v", path, err)
				}
			}(tempDir)

			repo, service := tt.setupRepo(t, tempDir)

			err = service.Commit(tt.commitMessage, tt.fileList...)

			if tt.wantErr {
				assert.Error(t, err)
				if tt.errContains != "" {
					assert.Contains(t, err.Error(), tt.errContains)
				}
				return
			}

			assert.NoError(t, err)

			// Run validation if provided
			if tt.validate != nil {
				tt.validate(t, repo, tempDir)
			}
		})
	}
}

func createTestRepo(t *testing.T, repoPath string) (*git.Repository, *Service) {
	file := files.NewService(repoPath)
	srv := NewService(repoPath, file.Fdb)

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
	gitc := NewService(root, fil.Fdb)

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
