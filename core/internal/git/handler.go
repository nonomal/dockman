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

func NewConnectHandler(srv *Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) ListCommits(_ context.Context, c *connect.Request[v1.File]) (*connect.Response[v1.CommitList], error) {
	//err := h.srv.ListFiles()
	//if err != nil {
	//	return nil, err
	//}

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

func (h *Handler) ListBranches(context.Context, *connect.Request[v1.ListBranchesRequest]) (*connect.Response[v1.ListBranchesResponse], error) {
	branches, err := h.srv.ListBranches()
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&v1.ListBranchesResponse{Branches: branches}), nil
}

func (h *Handler) SyncFile(_ context.Context, req *connect.Request[v1.FileRequest]) (*connect.Response[v1.Empty], error) {
	branch := req.Msg.GetBranch()
	filepath := req.Msg.GetFilepath()

	if err := h.srv.SyncFile(filepath, branch); err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.Empty{}), nil
}

func (h *Handler) ListFileFromBranch(_ context.Context, req *connect.Request[v1.BranchListFileRequest]) (*connect.Response[v1.BranchListFileResponse], error) {
	branch := req.Msg.GetBranch()

	inBranch, err := h.srv.ListFilesInBranch(branch)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.BranchListFileResponse{Files: inBranch}), nil
}
