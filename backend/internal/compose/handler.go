package compose

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	comprpc "github.com/RA341/dockman/generated/compose/v1"
	"io"
)

type Handler struct {
	srv *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{srv: service}
}

func (h *Handler) List(_ context.Context, _ *connect.Request[comprpc.Empty]) (*connect.Response[comprpc.ListResponse], error) {
	flist, err := h.srv.List()
	if err != nil {
		return nil, err
	}

	var resp []*comprpc.FileGroup
	for key, val := range flist {
		resp = append(resp, &comprpc.FileGroup{
			Root:     key,
			SubFiles: val,
		})
	}
	return connect.NewResponse(&comprpc.ListResponse{Groups: resp}), nil
}

func (h *Handler) Create(_ context.Context, c *connect.Request[comprpc.CreateFile]) (*connect.Response[comprpc.Empty], error) {
	filename, err := getFile(c.Msg.GetFile())
	if err != nil {
		return nil, err
	}
	parent := c.Msg.GetParent()

	if err := h.srv.Create(filename, parent); err != nil {
		return nil, err
	}

	return &connect.Response[comprpc.Empty]{}, nil
}
func (h *Handler) Delete(_ context.Context, c *connect.Request[comprpc.File]) (*connect.Response[comprpc.Empty], error) {
	filename, err := getFile(c.Msg)
	if err != nil {
		return nil, err
	}

	if err := h.srv.Delete(filename); err != nil {
		return nil, err
	}

	return &connect.Response[comprpc.Empty]{}, nil

}

func (h *Handler) Rename(ctx context.Context, c *connect.Request[comprpc.RenameFile]) (*connect.Response[comprpc.Empty], error) {
	//TODO implement me
	panic("implement me")
}

func (h *Handler) UpdateContents(ctx context.Context, c *connect.Request[comprpc.File]) (*connect.Response[comprpc.File], error) {
	//err := h.srv.Update(c.Msg.GetName())
	//if err != nil {
	//	return nil, err
	//}

	return connect.NewResponse(&comprpc.File{}), nil
}

func (h *Handler) LoadContents(_ context.Context, req *connect.Request[comprpc.File], stream *connect.ServerStream[comprpc.FileTransfer]) error {
	reader, closer, err := h.srv.Load(req.Msg.GetFilename())
	if err != nil {
		return err
	}
	defer closeFile(closer)

	// 5kb chunks
	const chunkSize = 5 * 1024
	buffer := make([]byte, chunkSize)
	for {
		n, err := reader.Read(buffer)
		if n > 0 {
			if err := stream.Send(
				&comprpc.FileTransfer{ChunkData: buffer[:n]},
			); err != nil {
				return err
			}
		}

		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
	}

	return nil
}

func getFile(c *comprpc.File) (string, error) {
	msg := c.GetFilename()
	if msg == "" {
		return "", fmt.Errorf("name is empty")
	}
	return msg, nil
}
