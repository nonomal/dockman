package files

import (
	"context"
	"fmt"
	"maps"
	"path/filepath"
	"slices"
	"strings"

	"connectrpc.com/connect"
	"github.com/RA341/dockman/generated/files/v1"
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
		// Sort subfiles with the updated rule
		slices.SortFunc(fileList[key], func(a, b string) int {
			return sortFiles(a, b, fileList)
		})

		resp = append(resp, &v1.FileGroup{
			Root:     key,
			SubFiles: fileList[key],
		})
	}

	// Sort groups alphabetically
	slices.SortFunc(resp, func(a, b *v1.FileGroup) int {
		return sortFiles(a.Root, b.Root, fileList)
	})

	return connect.NewResponse(&v1.ListResponse{Groups: resp}), nil
}

func sortFiles(a, b string, fileList map[string][]string) int {
	ra := getSortRank(a, fileList)
	rb := getSortRank(b, fileList)

	if ra < rb {
		return -1
	}
	if ra > rb {
		return 1
	}
	return strings.Compare(a, b)
}

// getSortRank determines priority: dotfiles, directories, then files by getFileSortRank
func getSortRank(name string, fileList map[string][]string) int {
	// 0: dotfiles (highest priority)
	if strings.HasPrefix(filepath.Base(name), ".") {
		return 0
	}

	// Check if it's a directory (has subfiles)
	if len(fileList[name]) > 0 {
		return 1
	}

	// 2+: normal files, ranked by getFileSortRank
	return 2 + getFileSortRank(name)
}

// getFileSortRank assigns priority within normal files
func getFileSortRank(filename string) int {
	base := filepath.Base(filename)
	// Priority 0: docker-compose files
	if strings.HasSuffix(base, "compose.yaml") || strings.HasSuffix(base, "compose.yml") {
		return 0
	}
	// Priority 1: other yaml/yml
	if strings.HasSuffix(base, ".yaml") || strings.HasSuffix(base, ".yml") {
		return 1
	}
	// Priority 2: everything else
	return 2
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
