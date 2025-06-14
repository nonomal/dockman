package git

import (
	"fmt"
	"github.com/RA341/dockman/internal/files"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
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
	fileMan   files.FileDB
}

func NewService(root string, fileMan files.FileDB) *Service {
	repo, err := initializeGit(root)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create git service")
	}

	srv := &Service{repo: repo, fileMan: fileMan, repoPath: root}
	if err := srv.CheckDockmanDBStatus(files.BoltFileDBName); err != nil {
		log.Fatal().Err(err).Msg("Failed to check dockman to vcs")
	}

	return srv
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

func (s *Service) Commit(commitMessage string, fileList ...string) error {
	tree, err := s.repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	for _, file := range fileList {
		_, err := tree.Add(file)
		if err != nil {
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
	fileList, err := s.fileMan.GetFileGroup(filename)
	if err != nil {
		return err
	}

	err = s.Commit(commitMessage, fileList...)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) ListCommitByFile(filePath string) ([]*object.Commit, error) {
	opts := &git.LogOptions{
		FileName: &filePath,
	}

	cIter, err := s.repo.Log(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit iterator for file %s: %w", filePath, err)
	}
	defer cIter.Close()

	var commitList []*object.Commit

	err = cIter.ForEach(func(c *object.Commit) error {
		commitList = append(commitList, c)
		return nil
	})
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("error while iterating commits for file: %w", err)
	}

	return commitList, nil
}

func (s *Service) CheckDockmanDBStatus(filename string) error {
	worktree, err := s.repo.Worktree()
	if err != nil {
		return err
	}

	status, err := worktree.Status()
	if err != nil {
		return err
	}

	var commitMessage = ""

	if fileStatus, exists := status[filename]; exists {
		if fileStatus.Staging == git.Untracked {
			log.Info().Str("file", filename).Msg("File is untracked")
			commitMessage = "added dockman db"
		} else if fileStatus.Staging == git.Modified {
			log.Info().Str("file", filename).Msg("File is modified")
			commitMessage = "updated dockman db"
		}
	}

	if commitMessage != "" {
		if err := s.Commit(commitMessage, filename); err != nil {
			return err
		}
	} else {
		log.Info().Str("file", filename).Msg("File is clean (no changes)")
	}

	return err
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
