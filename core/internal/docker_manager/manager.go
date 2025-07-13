package docker_manager

import (
	"fmt"
	"github.com/RA341/dockman/internal/ssh"
	"github.com/RA341/dockman/pkg"
	"github.com/docker/docker/client"
	"github.com/pkg/sftp"
	"github.com/rs/zerolog/log"
	"sync"
)

// LocalClient is the name given to the local docker daemon instance
const LocalClient = "local"

type ClientManager struct {
	connectedClients pkg.Map[string, *ManagedMachine]
	activeClient     string
	clientLock       *sync.Mutex
	sshSrv           *ssh.Service
}

func NewClientManager(sshSrv *ssh.Service) (*ClientManager, string) {
	cm := &ClientManager{
		sshSrv:           sshSrv,
		connectedClients: pkg.Map[string, *ManagedMachine]{},
		clientLock:       &sync.Mutex{},
	}

	defaultHost, err := cm.LoadClients()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load clients")
	}

	return cm, defaultHost
}

func (m *ClientManager) GetMachine() *ManagedMachine {
	val, ok := m.connectedClients.Load(m.GetActiveClient())
	if !ok {
		// this should never happen since only way of changing client should be SwitchClient,
		// and we can choose only from valid list of clients validated by SwitchClient
		log.Warn().Str("name", m.activeClient).Msg("Client is not not found, THIS SHOULD NEVER HAPPEN, submit a bug report https://github.com/RA341/dockman/issues")
	}
	return val
}

func (m *ClientManager) GetDocker() *client.Client {
	val, ok := m.connectedClients.Load(m.GetActiveClient())
	if !ok {
		log.Warn().Str("name", m.activeClient).Msg("Client is not connected")
	}
	return val.dockerClient
}

func (m *ClientManager) GetSFTP() *ssh.SftpClient {
	val, ok := m.connectedClients.Load(m.GetActiveClient())
	if !ok {
		log.Warn().Str("name", m.activeClient).Msg("Client is not connected")
	}
	return val.sftpClient
}

func (m *ClientManager) GetActiveClient() string {
	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	return m.activeClient
}

func (m *ClientManager) SwitchClient(name string) error {
	_, ok := m.connectedClients.Load(name)
	if !ok {
		return fmt.Errorf("invalid client %s", name)
	}

	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	log.Debug().Str("client", name).Msg("setting default client")
	m.activeClient = name
	return nil
}

func (m *ClientManager) ListClients() []string {
	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	var cliList []string
	m.connectedClients.Range(func(key string, _ *ManagedMachine) bool {
		cliList = append(cliList, key)
		return true
	})

	return cliList
}

func (m *ClientManager) LoadClients() (string, error) {
	clientConfig := m.sshSrv.Config.List()

	var wg sync.WaitGroup
	for name, machine := range clientConfig.Machines {
		// Load remote clients concurrently
		wg.Add(1)
		go m.loadSSHClient(machine, name, &wg)
	}
	// Load local client concurrently
	wg.Add(1)
	go m.loadLocalClient(clientConfig, &wg)
	wg.Wait()

	conClients := m.ListClients()
	if len(conClients) < 1 {
		// at least a single machine should always be available
		return "", fmt.Errorf("no docker clients could be connected, check your config")
	}

	if clientConfig.DefaultHost != "" {
		return clientConfig.DefaultHost, nil
	}

	if m.ClientExists(LocalClient) {
		return LocalClient, nil
	}

	// get first available host
	return conClients[0], nil
}

func (m *ClientManager) ClientExists(name string) bool {
	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	_, ok := m.connectedClients.Load(name)
	return ok
}
func (m *ClientManager) loadLocalClient(clientConfig ssh.ClientConfig, wg *sync.WaitGroup) {
	defer wg.Done()

	if !clientConfig.EnableLocalDocker {
		log.Info().Msgf("Local docker is disabled in config")
		return
	}

	localClient, err := NewClientFromLocal()
	if err != nil {
		log.Error().Err(err).Msg("Failed to setup local docker client")
		return
	}

	m.testAndStore(LocalClient, &ManagedMachine{
		dockerClient: localClient,
	})
}

func (m *ClientManager) loadSSHClient(machine ssh.MachineOptions, name string, s *sync.WaitGroup) {
	defer s.Done()

	if !machine.Enable {
		return
	}

	auth, err := m.sshSrv.GetAuthMethod(name, &machine)
	if err != nil {
		log.Warn().Err(err).Str("client", name).Msg("Failed to load auth method for host, check your config")
		return
	}

	sshClient, err := ssh.NewSSHClient(name, &machine, auth, m.sshSrv.SaveHostKey(name, machine))
	if err != nil {
		log.Error().Err(err).Str("client", name).Msg("Failed to setup ssh client")
		return
	}

	dockerCli, err := newClientFromSSH(sshClient)
	if err != nil {
		log.Error().Err(err).Str("client", name).Msg("Failed to setup remote docker client")
		return
	}

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		log.Error().Err(err).Str("client", name).Msg("Failed to setup sftp client")
		return
	}

	m.testAndStore(name, &ManagedMachine{
		dockerClient: dockerCli,
		sshClient:    sshClient,
		sftpClient:   ssh.NewSFTPCli(sftpClient),
	})
}

func (m *ClientManager) testAndStore(name string, newClient *ManagedMachine) {
	_, err := testClientConn(newClient.dockerClient)
	if err != nil {
		log.Warn().Err(err).Msgf("docker client health check failed: %s", name)
		return
	}

	m.connectedClients.Store(name, newClient)
}
