package git

import (
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/rs/zerolog/log"
)

type Service struct {
	username  string
	authToken string
	repoPath  string
	repo      *git.Repository
}

func (s *Service) TrackFiles(files ...string) {

}

func (s *Service) ListCommits(files ...string) {

}

func (s *Service) ListCommitByFile(files string) {

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

func NewService(root string) *Service {
	srv := Service{repoPath: root}

	if err := srv.Init(); err != nil {
		log.Fatal().Err(err).Msg("Failed to start git service")
	}

	return &srv
}

func (s *Service) Init() error {
	// Check if the repository already exists
	existingRepo, err := git.PlainOpen(s.repoPath)
	if err == nil {
		s.repo = existingRepo
		return nil
	}

	// PlainOpen returns an error, implies the directory doesn't exist,
	// or it's not a git repository, initialize
	newRepo, err := git.PlainInit(s.repoPath, false)
	if err != nil {
		return fmt.Errorf("Error initializing repository: %s\n", err)
	}

	log.Info().Str("path", s.repoPath).Msg("Repository initialized successfully")
	s.repo = newRepo

	return nil
}
