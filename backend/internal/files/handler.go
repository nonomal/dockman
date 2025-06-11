package files

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	comprpc "github.com/RA341/dockman/generated/compose/v1"
	"maps"
	"slices"
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
	for _, key := range slices.Sorted(maps.Keys(flist)) {
		resp = append(resp, &comprpc.FileGroup{
			Root:     key,
			SubFiles: flist[key],
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

//func (h *Handler) UpdateContents(_ context.Context, stream *connect.ClientStream[comprpc.FileTransfer]) (*connect.Response[comprpc.Empty], error) {
//	stream.Receive()
//	filename := stream.Msg().GetFilename()
//	if filename == "" {
//		return nil, fmt.Errorf("filename not received no data was written")
//	}
//
//	err := h.srv.Save(filename)
//	if err != nil {
//		return nil, err
//	}
//	defer closeFile(file)
//
//	for stream.Receive() {
//		_, err := writer.Write(stream.Msg().GetChunkData())
//		if err != nil {
//			return nil, err
//		}
//	}
//	if err = stream.Err(); err != nil {
//		return nil, connect.NewError(connect.CodeUnknown, err)
//	}
//
//	if err = writer.Flush(); err != nil {
//		return nil, err
//	}
//
//	return &connect.Response[comprpc.Empty]{}, nil
//}
//
//func (h *Handler) LoadContents(_ context.Context, req *connect.Request[comprpc.File], stream *connect.ServerStream[comprpc.FileTransfer]) error {
//	reader, closer, err := h.srv.Load(req.Msg.GetFilename())
//	if err != nil {
//		return err
//	}
//	defer closeFile(closer)
//
//	// 5kb chunks
//	const chunkSize = 5 * 1024
//	buffer := make([]byte, chunkSize)
//	for {
//		n, err := reader.Read(buffer)
//		if n > 0 {
//			if err := stream.Send(
//				&comprpc.FileTransfer{
//					FileInfo: &comprpc.FileTransfer_ChunkData{ChunkData: buffer[:n]},
//				},
//			); err != nil {
//				return err
//			}
//		}
//
//		if err != nil {
//			if err == io.EOF {
//				break
//			}
//			return err
//		}
//	}
//
//	return nil
//}

func getFile(c *comprpc.File) (string, error) {
	msg := c.GetFilename()
	if msg == "" {
		return "", fmt.Errorf("name is empty")
	}
	return msg, nil
}
