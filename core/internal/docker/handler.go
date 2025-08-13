package docker

import (
	"bufio"
	"cmp"
	"connectrpc.com/connect"
	"context"
	"fmt"
	v1 "github.com/RA341/dockman/generated/docker/v1"
	"github.com/RA341/dockman/pkg/fileutil"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/rs/zerolog/log"
	"io"
	"net"
	"net/http"
	"net/url"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

type GetService func() *Service

type Handler struct {
	srv  GetService
	addr string
	pass string
}

func NewConnectHandler(srv GetService, host, pass string) *Handler {
	return &Handler{
		srv:  srv,
		addr: host,
		pass: pass,
	}
}

////////////////////////////////////////////
// 			Compose Actions 			  //
////////////////////////////////////////////

func (h *Handler) ComposeStart(ctx context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	return h.executeComposeStreamCommand(
		ctx,
		req.Msg.GetFilename(),
		responseStream,
		h.srv().ComposeUp,
		req.Msg.GetSelectedServices()...,
	)
}

func (h *Handler) ComposeStop(ctx context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	return h.executeComposeStreamCommand(
		ctx,
		req.Msg.GetFilename(),
		responseStream,
		h.srv().ComposeStop,
		req.Msg.GetSelectedServices()...,
	)
}

func (h *Handler) ComposeRemove(ctx context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	return h.executeComposeStreamCommand(
		ctx,
		req.Msg.GetFilename(),
		responseStream,
		h.srv().ComposeDown,
		req.Msg.GetSelectedServices()...,
	)
}

func (h *Handler) ComposeRestart(ctx context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	return h.executeComposeStreamCommand(
		ctx,
		req.Msg.GetFilename(),
		responseStream,
		h.srv().ComposeRestart,
		req.Msg.GetSelectedServices()...,
	)
}

func (h *Handler) ComposeUpdate(ctx context.Context, req *connect.Request[v1.ComposeFile], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	err := h.executeComposeStreamCommand(
		ctx,
		req.Msg.GetFilename(),
		responseStream,
		h.srv().ComposeUpdate,
		req.Msg.GetSelectedServices()...,
	)
	if err != nil {
		return err
	}

	go sendReqToUpdater(h.addr, h.pass, "")

	return nil
}

func (h *Handler) ComposeList(ctx context.Context, req *connect.Request[v1.ComposeFile]) (*connect.Response[v1.ListResponse], error) {
	project, err := h.srv().LoadProject(ctx, req.Msg.GetFilename())
	if err != nil {
		return nil, err
	}

	result, err := h.srv().ComposeList(ctx, project, true)
	if err != nil {
		return nil, err
	}

	rpcResult := h.containersToRpc(result)
	return connect.NewResponse(&v1.ListResponse{List: rpcResult}), err
}

func (h *Handler) containersToRpc(result []container.Summary) []*v1.ContainerList {
	var dockerResult []*v1.ContainerList
	for _, stack := range result {
		var portSlice []*v1.Port
		for _, p := range stack.Ports {
			if isIPV4(p.IP) {
				p.IP = h.srv().daemonAddr
				// ignore ipv6 ports no one uses it anyway
				portSlice = append(portSlice, toRPCPort(p))
			}
		}

		slices.SortFunc(portSlice, func(port1 *v1.Port, port2 *v1.Port) int {
			if cmpResult := cmp.Compare(port1.Public, port2.Public); cmpResult != 0 {
				return cmpResult
			}
			// ports are equal, compare by type 'tcp or udp'
			return cmp.Compare(port1.Type, port2.Type)
		})

		dockerResult = append(dockerResult, toRPContainer(stack, h.srv().composeRoot, portSlice))
	}
	return dockerResult
}

////////////////////////////////////////////
// 			Container Actions 			  //
////////////////////////////////////////////

func (h *Handler) ContainerStart(ctx context.Context, req *connect.Request[v1.ContainerRequest]) (*connect.Response[v1.LogsMessage], error) {
	err := h.srv().ContainersStart(ctx, req.Msg.ContainerIds...)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.LogsMessage{}), nil
}

func (h *Handler) ContainerStop(ctx context.Context, req *connect.Request[v1.ContainerRequest]) (*connect.Response[v1.LogsMessage], error) {
	err := h.srv().ContainersStop(ctx, req.Msg.ContainerIds...)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.LogsMessage{}), nil
}

func (h *Handler) ContainerRemove(ctx context.Context, req *connect.Request[v1.ContainerRequest]) (*connect.Response[v1.LogsMessage], error) {
	err := h.srv().ContainersRemove(ctx, req.Msg.ContainerIds...)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.LogsMessage{}), nil
}

func (h *Handler) ContainerRestart(ctx context.Context, req *connect.Request[v1.ContainerRequest]) (*connect.Response[v1.LogsMessage], error) {
	err := h.srv().ContainersRestart(ctx, req.Msg.ContainerIds...)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&v1.LogsMessage{}), nil
}

func (h *Handler) ContainerUpdate(ctx context.Context, req *connect.Request[v1.ContainerRequest]) (*connect.Response[v1.LogsMessage], error) {
	err := h.srv().ContainersUpdate(ctx, req.Msg.ContainerIds...)
	if err != nil {
		return nil, err
	}
	return nil, fmt.Errorf("TODO: unimplemented container update")
}

func (h *Handler) ContainerList(ctx context.Context, _ *connect.Request[v1.Empty]) (*connect.Response[v1.ListResponse], error) {
	result, err := h.srv().ContainersList(ctx)
	if err != nil {
		return nil, err
	}

	rpcResult := h.containersToRpc(result)
	return connect.NewResponse(&v1.ListResponse{List: rpcResult}), err
}

func (h *Handler) ContainerStats(ctx context.Context, req *connect.Request[v1.StatsRequest]) (*connect.Response[v1.StatsResponse], error) {
	file := req.Msg.GetFile()

	var containers []ContainerStats
	var err error
	if file != nil {
		// file was passed load it from context
		project, err := h.srv().LoadProject(ctx, file.Filename)
		if err != nil {
			return nil, err
		}
		containers, err = h.srv().ComposeStats(ctx, project)
	} else {
		containers, err = h.srv().ContainerStats(ctx, container.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	field := req.Msg.GetSortBy().Enum()
	if field == nil {
		field = v1.SORT_FIELD_NAME.Enum()
	}
	sortFn := getSortFn(*field)
	orderby := *req.Msg.Order.Enum()

	// returns in desc order
	slices.SortFunc(containers, func(a, b ContainerStats) int {
		res := sortFn(a, b)
		if orderby == v1.ORDER_ASC {
			return -res // Reverse the comparison for descending order
		}
		return res
	})

	stats := make([]*v1.ContainerStats, len(containers))
	for i, cont := range containers {
		stats[i] = ToRPCStat(cont)
	}

	return connect.NewResponse(&v1.StatsResponse{
		Containers: stats,
	}), nil
}

func (h *Handler) ContainerLogs(ctx context.Context, req *connect.Request[v1.ContainerLogsRequest], responseStream *connect.ServerStream[v1.LogsMessage]) error {
	if req.Msg.GetContainerID() == "" {
		return fmt.Errorf("container id is required")
	}

	logsReader, err := h.srv().ContainerLogs(ctx, req.Msg.GetContainerID())
	if err != nil {
		return err
	}
	defer fileutil.Close(logsReader)

	writer := &ContainerLogWriter{responseStream: responseStream}
	if _, err = stdcopy.StdCopy(writer, writer, logsReader); err != nil {
		return err
	}

	return nil
}

////////////////////////////////////////////
// 				Image Actions 			  //
////////////////////////////////////////////

func (h *Handler) ImageList(ctx context.Context, req *connect.Request[v1.ListImagesRequest]) (*connect.Response[v1.ListImagesResponse], error) {
	images, err := h.srv().ListImages(ctx)
	if err != nil {
		return nil, err
	}

	var unusedContainers int64
	var totalDisk int64
	var untagged int64
	var rpcImages []*v1.Image

	for _, img := range images {
		totalDisk += img.Size

		if img.Containers == 0 {
			unusedContainers++
		}

		if len(img.RepoTags) == 0 {
			untagged++
		}

		rpcImages = append(rpcImages, &v1.Image{
			Containers:  img.Containers,
			Created:     img.Created,
			Id:          img.ID,
			Labels:      img.Labels,
			ParentId:    img.ParentID,
			RepoDigests: img.RepoDigests,
			RepoTags:    img.RepoTags,
			SharedSize:  img.SharedSize,
			Size:        img.Size,
			Manifests:   []*v1.ManifestSummary{}, // todo
		})
	}

	return connect.NewResponse(&v1.ListImagesResponse{
		TotalDiskUsage:   totalDisk,
		Images:           rpcImages,
		UnusedImageCount: unusedContainers,
	}), err
}

func (h *Handler) ImageRemove(ctx context.Context, req *connect.Request[v1.RemoveImageRequest]) (*connect.Response[v1.RemoveImageResponse], error) {
	for _, img := range req.Msg.ImageIds {
		_, err := h.srv().ImageDelete(ctx, img)
		if err != nil {
			return nil, fmt.Errorf("unable to remove image %s: %w", img, err)
		}
	}

	return connect.NewResponse(&v1.RemoveImageResponse{}), nil
}

func (h *Handler) ImagePruneUnused(ctx context.Context, req *connect.Request[v1.ImagePruneRequest]) (*connect.Response[v1.ImagePruneResponse], error) {
	var result image.PruneReport
	var err error
	if req.Msg.GetPruneAll() {
		result, err = h.srv().PruneUnusedImages(ctx)
	} else {
		result, err = h.srv().PruneUntaggedImages(ctx)
	}
	if err != nil {
		return nil, err
	}

	response := v1.ImagePruneResponse{
		SpaceReclaimed: result.SpaceReclaimed,
	}

	var deleted []*v1.ImagesDeleted
	for _, res := range result.ImagesDeleted {
		deleted = append(deleted, &v1.ImagesDeleted{
			Deleted:  res.Deleted,
			Untagged: res.Untagged,
		})
	}
	response.Deleted = deleted

	return connect.NewResponse(&response), nil
}

////////////////////////////////////////////
// 				Volume Actions 			  //
////////////////////////////////////////////

func (h *Handler) VolumeList(ctx context.Context, req *connect.Request[v1.ListVolumesRequest]) (*connect.Response[v1.ListVolumesResponse], error) {
	volumes, err := h.srv().VolumesList(ctx)
	if err != nil {
		return nil, err
	}

	var rpcVolumes []*v1.Volume
	for _, vol := range volumes.Volumes {
		rpcVolumes = append(rpcVolumes, &v1.Volume{
			CreatedAt:  vol.CreatedAt,
			Driver:     vol.Driver,
			Labels:     vol.Labels,
			MountPoint: vol.Mountpoint,
			Name:       vol.Name,
			Scope:      vol.Scope,
		})
	}

	return connect.NewResponse(&v1.ListVolumesResponse{Volumes: rpcVolumes}), nil
}

func (h *Handler) VolumeCreate(_ context.Context, req *connect.Request[v1.CreateVolumeRequest]) (*connect.Response[v1.CreateVolumeResponse], error) {
	//TODO implement me
	return nil, fmt.Errorf(" implement me VolumeCreate")
}

func (h *Handler) VolumeDelete(_ context.Context, req *connect.Request[v1.DeleteVolumeRequest]) (*connect.Response[v1.DeleteVolumeResponse], error) {
	//TODO implement me
	return nil, fmt.Errorf(" implement me VolumeDelete")
}

////////////////////////////////////////////
// 				Network Actions 		  //
////////////////////////////////////////////

func (h *Handler) NetworkList(ctx context.Context, _ *connect.Request[v1.ListNetworksRequest]) (*connect.Response[v1.ListNetworksResponse], error) {
	networks, err := h.srv().NetworksList(ctx)
	if err != nil {
		return nil, err
	}

	var rpcNetworks []*v1.Network
	for _, netI := range networks {
		rpcNetworks = append(rpcNetworks, &v1.Network{
			Name:       netI.Name,
			Id:         netI.ID,
			Scope:      netI.Scope,
			Driver:     netI.Driver,
			EnableIpv4: netI.EnableIPv4,
			EnableIpv6: netI.EnableIPv6,
			Internal:   netI.Internal,
			Attachable: netI.Attachable,
			Ingress:    netI.Ingress,
			ConfigOnly: netI.ConfigOnly,
		})
	}

	return connect.NewResponse(&v1.ListNetworksResponse{Networks: rpcNetworks}), nil
}

func (h *Handler) NetworkCreate(_ context.Context, req *connect.Request[v1.CreateNetworkRequest]) (*connect.Response[v1.CreateNetworkResponse], error) {
	//TODO implement me
	return nil, fmt.Errorf(" implement me NetworkCreate")
}

func (h *Handler) NetworkDelete(_ context.Context, req *connect.Request[v1.DeleteNetworkRequest]) (*connect.Response[v1.DeleteNetworkResponse], error) {
	//TODO implement me
	return nil, fmt.Errorf(" implement me NetworkDelete")
}

////////////////////////////////////////////
// 				Utils 			  		  //
////////////////////////////////////////////

// executeComposeStreamCommand handles the boilerplate for running a Docker Compose command that streams logs.
func (h *Handler) executeComposeStreamCommand(
	ctx context.Context,
	composeFile string,
	responseStream *connect.ServerStream[v1.LogsMessage],
	action func(context.Context, *types.Project, api.Service, ...string) error,
	services ...string,
) error {
	project, err := h.srv().LoadProject(ctx, composeFile)
	if err != nil {
		return err
	}

	// todo dockman updater
	//services = h.srv().withoutDockman(project, services...)
	//log.Debug().Strs("ssdd", services).Msg("compose stream")

	pipeWriter, wg := streamManager(func(val string) error {
		if err = responseStream.Send(&v1.LogsMessage{Message: val}); err != nil {
			return err
		}
		return nil
	})

	composeClient, err := h.srv().LoadComposeClient(pipeWriter, nil)
	if err != nil {
		return err
	}

	// incase the stream connection is lost context.Background
	// will allow the service to continue executing, instead of stopping mid-operation
	if err = action(context.Background(), project, composeClient, services...); err != nil {
		fileutil.Close(pipeWriter)
		return err
	}

	fileutil.Close(pipeWriter)
	wg.Wait()

	return nil
}

func ToRPCStat(cont ContainerStats) *v1.ContainerStats {
	return &v1.ContainerStats{
		Id:          cont.ID,
		Name:        strings.TrimPrefix(cont.Name, "/"),
		CpuUsage:    cont.CPUUsage,
		MemoryUsage: cont.MemoryUsage,
		MemoryLimit: cont.MemoryLimit,
		NetworkRx:   cont.NetworkRx,
		NetworkTx:   cont.NetworkTx,
		BlockRead:   cont.BlockRead,
		BlockWrite:  cont.BlockWrite,
	}
}

func isIPV4(ip string) bool {
	parsedIP := net.ParseIP(ip)
	return parsedIP != nil && parsedIP.To4() != nil
}

func getSortFn(field v1.SORT_FIELD) func(a, b ContainerStats) int {
	switch field {
	case v1.SORT_FIELD_CPU:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.CPUUsage, a.CPUUsage)
		}
	case v1.SORT_FIELD_MEM:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.MemoryUsage, a.MemoryUsage)
		}
	case v1.SORT_FIELD_NETWORK_RX:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.NetworkRx, a.NetworkRx)
		}
	case v1.SORT_FIELD_NETWORK_TX:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.NetworkTx, a.NetworkTx)
		}
	case v1.SORT_FIELD_DISK_W:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.BlockWrite, a.BlockWrite)
		}
	case v1.SORT_FIELD_DISK_R:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.BlockRead, a.BlockRead)
		}
	case v1.SORT_FIELD_NAME:
		fallthrough
	default:
		return func(a, b ContainerStats) int {
			return cmp.Compare(b.Name, a.Name)
		}
	}
}

func sendReqToUpdater(addr, key, path string) {
	log.Debug().Str("addr", addr).Msg("sending request to updating dockman")
	if key != "" && addr != "" {
		addr = strings.TrimSuffix(addr, "/")
		addr = fmt.Sprintf("%s/update", addr) // Remove key from URL path

		formData := url.Values{}
		formData.Set("composeFile", path)

		req, err := http.NewRequest("POST", addr, strings.NewReader(formData.Encode()))
		if err != nil {
			log.Warn().Err(err).Str("addr", addr).Msg("unable to create request")
			return
		}

		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Authorization", key) // Add key as header

		httpclient := &http.Client{}
		if _, err = httpclient.Do(req); err != nil {
			log.Warn().Err(err).Str("addr", addr).Msg("unable to send request to updater")
			return
		}
	}
}

func streamManager(streamFn func(val string) error) (*io.PipeWriter, *sync.WaitGroup) {
	pipeReader, pipeWriter := io.Pipe()
	wg := sync.WaitGroup{}
	// Start a goroutine that reads from the pipe, splits the data into lines,
	// and sends each line as a message on the response stream.
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer fileutil.Close(pipeReader)

		scanner := bufio.NewScanner(pipeReader)
		for scanner.Scan() {
			err := streamFn(fmt.Sprintf("%s\n", scanner.Text()))
			if err != nil {
				log.Warn().Err(err).Msg("Failed to send message to stream")
			}
		}
		// If the scanner stops because of an error, log it.
		if err := scanner.Err(); err != nil {
			log.Error().Err(err).Msg("Error reading from pipe for streaming")
		}
	}()

	return pipeWriter, &wg
}

func toRPCPort(p container.Port) *v1.Port {
	return &v1.Port{
		Public:  int32(p.PublicPort),
		Private: int32(p.PrivatePort),
		Host:    p.IP,
		Type:    p.Type,
	}
}

func toRPContainer(stack container.Summary, composeRoot string, portSlice []*v1.Port) *v1.ContainerList {
	composePath := filepath.ToSlash(strings.TrimPrefix(stack.Labels[api.ConfigFilesLabel], composeRoot))
	return &v1.ContainerList{
		Name:        strings.TrimPrefix(stack.Names[0], "/"),
		Id:          stack.ID,
		ImageID:     stack.ImageID,
		ImageName:   stack.Image,
		Status:      stack.Status,
		Ports:       portSlice,
		ServiceName: stack.Labels[api.ServiceLabel],
		StackName:   stack.Labels[api.ProjectLabel],
		ServicePath: strings.TrimPrefix(composePath, "/"),
		Created:     time.Unix(stack.Created, 0).UTC().Format(time.RFC3339),
	}
}

type ContainerLogWriter struct {
	responseStream *connect.ServerStream[v1.LogsMessage]
}

func (l *ContainerLogWriter) Write(p []byte) (n int, err error) {
	if err := l.responseStream.Send(&v1.LogsMessage{Message: string(p)}); err != nil {
		return 0, err
	}
	return len(p), nil
}
