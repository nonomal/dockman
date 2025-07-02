package git

import (
	"errors"
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/rs/zerolog/log"
	"io"
	"time"
)

type Service struct {
	username  string
	authToken string
	repoPath  string
	repo      *git.Repository
}

func NewService(root string) *Service {
	repo, err := initializeGit(root)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create git service")
	}
	return &Service{repo: repo, repoPath: root}
}

func initializeGit(root string) (*git.Repository, error) {
	// Check if the repository already exists
	existingRepo, err := git.PlainOpen(root)
	if err == nil {
		return existingRepo, nil
	}

	// PlainOpen returns an error, implies the directory doesn't exist,
	// or it's not a git repository, initialize
	newRepo, err := git.PlainInitWithOptions(root, &git.PlainInitOptions{
		InitOptions: git.InitOptions{
			DefaultBranch: "refs/heads/main",
		},
		Bare: false,
	})
	if err != nil {
		return nil, fmt.Errorf("Error initializing repository: %s\n", err)
	}

	log.Info().Str("path", root).Msg("Repository initialized successfully")
	return newRepo, nil
}

// CommitAll stages all changes (new, modified, deleted) and commits them.
// It uses a generic commit message.
func (s *Service) CommitAll() error {
	w, err := s.repo.Worktree()
	if err != nil {
		return fmt.Errorf("could not get worktree: %w", err)
	}

	status, err := w.Status()
	if err != nil {
		return fmt.Errorf("could not get worktree status: %w", err)
	}

	if status.IsClean() {
		log.Info().Msg("Working directory is clean, no changes to commit")
		return nil
	}

	if _, err = w.Add("."); err != nil {
		return fmt.Errorf("could not stage changes: %w", err)
	}

	log.Info().Msg("Staged all changes")

	commitMsg := "chore: automatic commit of all changes"
	commitOpts := &git.CommitOptions{
		Author: &object.Signature{
			Name: s.username,
			When: time.Now(),
		},
	}

	commitHash, err := w.Commit(commitMsg, commitOpts)
	if err != nil {
		return fmt.Errorf("could not create commit: %w", err)
	}

	log.Info().Str("hash", commitHash.String()).Msg("Successfully created commit with hash")
	return nil
}

// SwitchBranch switches to a different branch.
// first commits any outstanding changes.
func (s *Service) SwitchBranch(name string) error {
	log.Info().Str("branch", name).Msg("Committing all changes before switching to branch")
	if err := s.CommitAll(); err != nil {
		return fmt.Errorf("failed to commit changes before switching branch: %w", err)
	}

	w, err := s.repo.Worktree()
	if err != nil {
		return fmt.Errorf("could not get worktree: %w", err)
	}

	branchRefName := plumbing.NewBranchReferenceName(name)

	log.Debug().Str("branch", name).Msg("Checking if branch exists...")
	_, err = s.repo.Reference(branchRefName, true)
	checkoutOpts := &git.CheckoutOptions{
		Branch: branchRefName,
	}

	// If the reference is not found, the branch doesn't exist
	// set the `Create` flag to true
	if errors.Is(err, plumbing.ErrReferenceNotFound) {
		log.Debug().Str("branch", name).Msg("Branch does not exist. Creating it.")
		checkoutOpts.Create = true
	} else if err != nil {
		return fmt.Errorf("could not lookup reference for branch '%s': %w", name, err)
	}

	if err = w.Checkout(checkoutOpts); err != nil {
		return fmt.Errorf("could not switch to branch '%s': %w", name, err)
	}

	log.Info().Str("branch", name).Msg("Switched to branch...")
	return nil
}

func (s *Service) Commit(commitMessage string, fileList ...string) error {
	tree, err := s.repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	status, err := tree.Status()
	if err != nil {
		return err
	}

	for _, file := range fileList {
		_, ok := status[file]
		if !ok {
			log.Debug().Str("file", file).Msg("File not found in status probably ignored, skipping...")
			continue
		}

		if _, err := tree.Add(file); err != nil {
			return fmt.Errorf("failed to add file: %w", err)
		}
	}

	gitConfig, err := s.repo.Config()
	if err != nil {
		return err
	}

	commit, err := tree.Commit(commitMessage, &git.CommitOptions{
		Author: &object.Signature{
			Name:  gitConfig.Author.Name,
			Email: gitConfig.Author.Email,
			When:  time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to commit changes: %w", err)
	}

	log.Debug().
		Str("hash", commit.String()).
		Strs("committed-files", fileList).
		Msg("committed for file with its group")

	return nil
}

func (s *Service) CommitFileGroup(commitMessage string, filename string) error {
	//fileList, err := s.fileMan.GetFileGroup(filename)
	//if err != nil {
	//	return err
	//}

	err := s.Commit(commitMessage, filename)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) LoadFileAtCommit(filePath, commitId string) (string, error) {
	hash := plumbing.NewHash(commitId)
	commit, err := s.repo.CommitObject(hash)
	if err != nil {
		return "", fmt.Errorf("failed to get commit %s: %w", commitId, err)
	}

	tree, err := commit.Tree()
	if err != nil {
		return "", fmt.Errorf("failed to get tree from commit: %w", err)
	}

	file, err := tree.File(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to get file %s from commit %s: %w", filePath, commitId, err)
	}

	// Get file contents
	content, err := file.Contents()
	if err != nil {
		return "", fmt.Errorf("failed to read file contents: %w", err)
	}

	return content, nil
}

func (s *Service) WithWorkTree(execFn func(worktree *git.Worktree) error) error {
	worktree, err := s.repo.Worktree()
	if err != nil {
		return err
	}

	return execFn(worktree)
}
func (s *Service) ListFiles() error {
	err := s.WithWorkTree(func(worktree *git.Worktree) error {
		status, err := worktree.Status()
		if err != nil {
			return err
		}

		for filename, stat := range status {

			//stat.Staging
			//stat.Worktree
			log.Debug().Msgf("File %s stats: %v", filename, stat)
		}
		//ps, err := gitignore.NewMatcher(fs, nil)
		return nil
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) ListCommitByFile(filePath string) ([]*object.Commit, error) {
	opts := &git.LogOptions{
		FileName: &filePath,
	}

	var commitList []*object.Commit

	cIter, err := s.repo.Log(opts)
	if err != nil {
		log.Debug().Err(err).Str("file", filePath).Msg("could not get commit iterator for file")
		return commitList, nil
	}
	defer cIter.Close()

	err = cIter.ForEach(func(c *object.Commit) error {
		commitList = append(commitList, c)
		return nil
	})
	if err != nil && err != io.EOF {
		log.Warn().Err(err).Str("file", filePath).Msg("error while iterating commits")
		return commitList, nil
	}

	return commitList, nil
}

// EditUserConfig updates user configuration, skipping empty parameters
func (s *Service) EditUserConfig(name, email string) error {
	conf, err := s.repo.Config()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}

	// Only update name if provided
	if name != "" {
		conf.Author.Name = name
	}

	// Only update email if provided
	if email != "" {
		conf.Author.Email = email
	}

	// Save the configuration back to the repository
	return s.repo.Storer.SetConfig(conf)
}

func (s *Service) ListCommits(files ...string) error {
	return nil
}

func (s *Service) EditRemote(remoteNickname string, repoUrl string) error {
	_, err := s.repo.CreateRemote(
		&config.RemoteConfig{
			Name: remoteNickname,
			URLs: []string{repoUrl},
		})
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) ListRemote(files string) {

}
