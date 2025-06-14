package git

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	v1 "github.com/RA341/dockman/generated/git/v1"
	"time"
)

type Handler struct {
	srv *Service
}

func NewHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) ListCommits(_ context.Context, c *connect.Request[v1.File]) (*connect.Response[v1.CommitList], error) {
	file, err := h.srv.ListCommitByFile(c.Msg.Name)
	if err != nil {
		return nil, err
	}

	var result []*v1.Commit
	for _, fi := range file {
		result = append(result, &v1.Commit{
			Hash:    fi.Hash.String(),
			Author:  fi.Author.Name,
			Email:   fi.Author.Email,
			When:    fi.Author.When.Format(time.RFC3339),
			Message: fi.Message,
		})
	}

	return connect.NewResponse(&v1.CommitList{Commits: result}), nil
}

func (h *Handler) Commit(_ context.Context, c *connect.Request[v1.CommitQuery]) (*connect.Response[v1.Empty], error) {
	if c.Msg.Message == "" {
		return nil, fmt.Errorf("commit message is empty")
	}

	err := h.srv.CommitFileGroup(c.Msg.Message, c.Msg.File.Name)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.Empty{}), nil
}
