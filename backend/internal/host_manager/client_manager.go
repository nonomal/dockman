package host_manager

import (
	"fmt"
	"github.com/RA341/dockman/pkg"
	"github.com/docker/docker/client"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/ssh"
	"net"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// LocalClient is the name given to the local docker daemon instance
const LocalClient = "localClient"

type ActiveClient func() *client.Client

type ClientManager struct {
	config           *ConfigManager
	connectedClients pkg.Map[string, *ManagedMachine]
	activeClient     string
	clientLock       *sync.Mutex
	customSSHFolder  string
}

func NewClientManager(basedir string, man *ConfigManager) *ClientManager {
	sshDir, err := initSSHDir(basedir)
	if err != nil {
		log.Fatal().Err(err).Msg("unable to initialize ssh dir")
	}

	cm := &ClientManager{
		config:           man,
		customSSHFolder:  sshDir,
		connectedClients: pkg.Map[string, *ManagedMachine]{},
		clientLock:       &sync.Mutex{},
	}

	if err = cm.LoadClients(); err != nil {
		log.Fatal().Err(err).Msg("Failed to load clients")
	}

	return cm
}

func (m *ClientManager) GetClientFn() ActiveClient {
	return func() *client.Client {
		val, ok := m.connectedClients.Load(m.GetActiveClient())
		if !ok {
			log.Warn().Str("name", m.activeClient).Msg("Client is not connected")
		}
		return val.client
	}
}

func (m *ClientManager) GetActiveClient() string {
	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	return m.activeClient
}

func (m *ClientManager) SwitchClient(name string) error {
	m.clientLock.Lock()
	defer m.clientLock.Unlock()

	_, ok := m.connectedClients.Load(name)
	if !ok {
		return fmt.Errorf("invalid client %s", name)
	}

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

func (m *ClientManager) LoadClients() error {
	clientConfig := m.config.List()

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

	//defaultClient := "hermes"
	if err := m.SwitchClient(LocalClient); err != nil {
		return fmt.Errorf("unable to swtich to client: %s", LocalClient)
	}

	if len(m.ListClients()) < 1 {
		// at least a single machine should always be available
		return fmt.Errorf("no docker clients could be connected, check your config")
	}

	return nil
}

func (m *ClientManager) loadLocalClient(clientConfig ClientConfig, wg *sync.WaitGroup) {
	defer wg.Done()

	if !clientConfig.EnableLocalDocker {
		log.Info().Msgf("Local docker is disabled in config")
		return
	}

	localClient, err := newLocalClient()
	if err != nil {
		log.Error().Err(err).Msg("Failed to setup local docker client")
		return
	}

	m.testAndStore(LocalClient, localClient)
}

func (m *ClientManager) loadSSHClient(machine MachineOptions, name string, s *sync.WaitGroup) {
	defer s.Done()

	if !machine.Enable {
		return
	}

	auth, err := m.getAuthMethod(name, &machine)
	if err != nil {
		log.Warn().Err(err).Str("name", name).Msg("Failed to load auth method for host, check your config")
		return
	}

	newClient, err := createSSHDockerConnection(name, &machine, auth, m.saveHostKey(name, machine))
	if err != nil {
		log.Error().Err(err).Str("client", name).Msg("Failed to setup remote docker client")
		return
	}

	m.testAndStore(name, newClient)
}

func (m *ClientManager) testAndStore(name string, newClient *client.Client) {
	_, err := testClientConn(newClient)
	if err != nil {
		log.Warn().Err(err).Msgf("docker client health check failed: %s", name)
		return
	}

	m.connectedClients.Store(name, &ManagedMachine{client: newClient})
}

func (m *ClientManager) saveHostKey(name string, machine MachineOptions) func(hostname string, remote net.Addr, key ssh.PublicKey) error {
	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		log.Debug().Str("name", name).Msg("Empty public key for, public key will be saved on connect")

		comment := fmt.Sprintf("added by dockman for machine %s on %s", name, time.Now().String())
		stringKey, err := publicKeyToString(key, comment)
		if err != nil {
			return fmt.Errorf("unable to convert public key for machine %s: %w", name, err)
		}

		machine.RemotePublicKey = stringKey
		if err = m.config.WriteAndSave(name, machine); err != nil {
			return err
		}

		return nil
	}
}

func (m *ClientManager) getAuthMethod(name string, machine *MachineOptions) (ssh.AuthMethod, error) {
	if machine.UsePublicKeyAuth {
		return withKeyPairAuth(m.customSSHFolder)
	} else if machine.Password != "" {
		return withPasswordAuth(machine), nil
	} else {
		// final fallback use .ssh in user dir
		// should fail on docker containers
		log.Debug().Str("client", name).Msg("falling back to SSH keys from home directory")
		return withKeyPairFromHome()
	}
}

func initSSHDir(basedir string) (string, error) {
	baseDir, err := filepath.Abs(basedir)
	if err != nil {
		return "", err
	}
	if err = os.MkdirAll(baseDir, 0755); err != nil {
		return "", err
	}

	sshDir, err := verifySSHKeyPair(baseDir)
	if err != nil {
		return "", err
	}

	return sshDir, nil
}
