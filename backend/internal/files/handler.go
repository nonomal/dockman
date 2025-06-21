package files

import (
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

	return connect.NewResponse(&v1.ListResponse{Groups: resp}), nil
}

func (h *Handler) Create(_ context.Context, c *connect.Request[v1.CreateFile]) (*connect.Response[v1.Empty], error) {
	filename, err := getFile(c.Msg.GetFile())
	if err != nil {
		return nil, err
	}
	parent := c.Msg.GetParent()

	if err := h.srv.Create(filename, parent); err != nil {
		return nil, err
	}

	return &connect.Response[v1.Empty]{}, nil
}

func (h *Handler) Exists(_ context.Context, req *connect.Request[v1.File]) (*connect.Response[v1.Empty], error) {
	ok, err := h.srv.Exists(req.Msg.GetFilename())
	if err != nil {
		return nil, err
	}

	if !ok {
		return nil, fmt.Errorf("file not found")
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

func (h *Handler) Rename(ctx context.Context, c *connect.Request[v1.RenameFile]) (*connect.Response[v1.Empty], error) {
	//TODO implement me
	panic("implement me")
}

func getFile(c *v1.File) (string, error) {
	msg := c.GetFilename()
	if msg == "" {
		return "", fmt.Errorf("name is empty")
	}
	return msg, nil
}
