package files

import (
	"cmp"
	"connectrpc.com/connect"
	"context"
	"fmt"
	"github.com/RA341/dockman/generated/files/v1"
	"maps"
	"slices"
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
		slices.Sort(fileList[key])
		resp = append(resp, &v1.FileGroup{
			Root:     key,
			SubFiles: fileList[key],
		})
	}

	slices.SortFunc(resp, func(a, b *v1.FileGroup) int {
		if res := len(b.SubFiles) - len(a.SubFiles); res != 0 {
			return res
		}
		// sort alphabetically
		return cmp.Compare(a.Root, b.Root)
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
