package docker

import (
	"context"
	"fmt"
	"io"
	"net"
	"time"

	"github.com/RA341/dockman/pkg/syncmap"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
)

// LocalClient is the name given to the local docker daemon instance
const LocalClient = "local"

type Service struct {
	Compose   *ComposeService
	Container *ContainerService
	execChan  syncmap.Map[string, chan string]
}

// dependencies common info used by container and compose service
// normally this would be in the service struct
// but since the services are seperated we use this
type dependencies struct {
	// hostname of the machine used to identify which client is running on
	hostname string
	daemon   *client.Client
	// address used to prefix container ports for direct links
	daemonAddr string
	// syncs local files to remote host
	syncer Syncer

	// only used by compose service not needed by container
	composeRoot string

	// to store updates about new images
	imageUpdateStore Store
	// external sidecar url to update a dockman container
	updaterUrl string
}

func NewService(
	daemonAddr string,
	dockerClient *client.Client,
	syncer Syncer,
	imageUpdateStore Store,
	name string,
	updaterUrl string,
	composeRoot string,
) *Service {
	uts := &dependencies{
		hostname:         name,
		daemon:           dockerClient,
		syncer:           syncer,
		daemonAddr:       daemonAddr,
		composeRoot:      composeRoot,
		imageUpdateStore: imageUpdateStore,
		updaterUrl:       updaterUrl,
	}

	containerClient := NewContainerService(uts)
	composeClient := NewComposeService(uts, containerClient)

	return &Service{
		Container: containerClient,
		Compose:   composeClient,
		execChan:  syncmap.Map[string, chan string]{},
	}
}

func (s *Service) StartContainerExecStream(ctx context.Context, containerID, cmd string, writer io.Writer) error {
	resp, err := s.Container.ExecContainer(ctx, containerID, []string{cmd})
	if err != nil {
		return fmt.Errorf("unable to exec into container: %v", err)
	}
	defer resp.Close()

	mesChan := make(chan string)
	s.execChan.Store(containerID, mesChan)

	exec := ExecHandler{
		inputChan:  mesChan,
		dockerConn: resp.Conn,
		output:     writer,
		ctx:        ctx,
	}

	exec.Start()
	return nil
}

func (s *Service) SendContainerInputCmd(containerID, cmd string) error {
	v, ok := s.execChan.Load(containerID)
	if !ok {
		return fmt.Errorf("unable to find container executor %s", containerID)
	}

	v <- cmd
	return nil
}

type ExecHandler struct {
	ctx        context.Context
	inputChan  chan string
	dockerConn net.Conn
	output     io.Writer
}

func (s *ExecHandler) Start() {
	go s.handleMessagesFromDocker()
}

func (s *ExecHandler) handleMessagesFromClient() {
	for {
		select {
		case <-s.ctx.Done():
			log.Debug().Msg("Stopped exec client handler")
			return
		case mes, ok := <-s.inputChan:
			if !ok {
				log.Warn().Msg("client closed the message channel")
				return
			}

			if _, err := s.dockerConn.Write([]byte(mes)); err != nil {
				log.Warn().Err(err).Msg("WebSocket write error")
				return
			}
		}
	}

}

// Read from Docker connection and forward to WebSocket client
func (s *ExecHandler) handleMessagesFromDocker() {
	// Use a buffer for reading chunks of data
	buffer := make([]byte, 4096)

	for {
		select {
		case <-s.ctx.Done():
			log.Debug().Msg("Stopped exec docker handler")
			return
		default:
			// Set read deadline to prevent hanging
			_ = s.dockerConn.SetReadDeadline(time.Now().Add(30 * time.Second))

			// Read raw bytes from Docker connection
			n, err := s.dockerConn.Read(buffer)
			if err != nil {
				if err == io.EOF {
					log.Debug().Msg("Docker connection closed")
				} else {
					log.Warn().Err(err).Msg("Docker read error")
				}
				return
			}

			if n > 0 {
				_, err = s.output.Write(buffer[:n])
				if err != nil {
					log.Warn().Err(err).Msg("docker exec write error")
					return
				}
			}
		}
	}
}

func (s *Service) Close() error {
	//return s.ContainerService.daemon().Close()
	// todo look into close
	return nil
}
