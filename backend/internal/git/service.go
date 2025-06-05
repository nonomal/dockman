package git

import (
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/rs/zerolog/log"
)

type Service struct {
	repoPath string
	repo     *git.Repository
}

func New(root string) (*Service, error) {
	srv := Service{repoPath: root}
	if err := srv.Init(); err != nil {
		return nil, err
	}
	return &srv, nil
}

func (s *Service) Init() error {
	// Check if the repository already exists
	existingRepo, err := git.PlainOpen(s.repoPath)
	if err == nil {
		s.repo = existingRepo
		return nil
	}

	// If PlainOpen returns an error, implies the directory doesn't exist,
	// or it's not a git repository. proceed to initialize.
	newRepo, err := git.PlainInit(s.repoPath, false)
	if err != nil {
		return fmt.Errorf("Error initializing repository: %s\n", err)
	}

	log.Info().Str("path", s.repoPath).Msg("Repository initialized successfully")
	s.repo = newRepo

	return nil
}
