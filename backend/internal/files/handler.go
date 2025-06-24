package files

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	"github.com/RA341/dockman/generated/files/v1"
	"maps"
	"slices"
	"strings"
)

type Handler struct {
	srv *Service
}

func NewConnectHandler(service *Service) *Handler {
	return &Handler{srv: service}
}

func (h *Handler) List(_ context.Context, _ *connect.Request[v1.Empty]) (*connect.Response[v1.ListResponse], error) {
	fileList, err := h.srv.List()
	if err != nil {
		return nil, err
	}

	var resp []*v1.FileGroup
	for _, key := range slices.Sorted(maps.Keys(fileList)) {
		slices.SortFunc(fileList[key], sortFiles)
		resp = append(resp, &v1.FileGroup{
			Root:     key,
			SubFiles: fileList[key],
		})
	}

	slices.SortFunc(resp, func(a, b *v1.FileGroup) int {
		if res := len(b.SubFiles) - len(a.SubFiles); res != 0 {
			return res
		}
		return sortFiles(a.Root, b.Root)
	})

	return connect.NewResponse(&v1.ListResponse{Groups: resp}), nil
}

func (h *Handler) Create(_ context.Context, c *connect.Request[v1.File]) (*connect.Response[v1.Empty], error) {
	filename, err := getFile(c.Msg)
	if err != nil {
		return nil, err
	}

	if err := h.srv.Create(filename); err != nil {
		return nil, err
	}

	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Exists(_ context.Context, req *connect.Request[v1.File]) (*connect.Response[v1.Empty], error) {
	if err := h.srv.Exists(req.Msg.GetFilename()); err != nil {
		return nil, err
	}

	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Delete(_ context.Context, c *connect.Request[v1.File]) (*connect.Response[v1.Empty], error) {
	filename, err := getFile(c.Msg)
	if err != nil {
		return nil, err
	}

	if err := h.srv.Delete(filename); err != nil {
		return nil, err
	}

	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Rename(context.Context, *connect.Request[v1.RenameFile]) (*connect.Response[v1.Empty], error) {
	return nil, fmt.Errorf("unimplemented")
}

func getFile(c *v1.File) (string, error) {
	msg := c.GetFilename()
	if msg == "" {
		return "", fmt.Errorf("name is empty")
	}
	return msg, nil
}

// sort using getFileSortRank
func sortFiles(a, b string) int {
	rankA := getFileSortRank(a)
	rankB := getFileSortRank(b)

	// the one with the lower rank (higher priority) comes first.
	if rankA < rankB {
		return -1 // a comes first
	}
	if rankA > rankB {
		return 1 // b comes first
	}
	// If ranks are the same, sort alphabetically.
	return strings.Compare(a, b)
}

// getFileSortRank assigns a priority score to a filename.
// Lower numbers have higher priority.
func getFileSortRank(filename string) int {
	// Priority 0: Highest priority for compose files
	if strings.HasSuffix(filename, "compose.yaml") || strings.HasSuffix(filename, "compose.yml") {
		return 0
	}
	// Priority 1: Next priority for any other yaml/yml files
	if strings.HasSuffix(filename, ".yaml") || strings.HasSuffix(filename, ".yml") {
		return 1
	}
	// Priority 2: Lowest priority for all other files
	return 2
}
