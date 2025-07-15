package ssh

import (
	"fmt"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/ssh"
	"net"
	"time"
)

type Service struct {
	Machines MachineManager
	Keys     KeyManager
}

func NewService(keyMan KeyManager, machManager MachineManager) *Service {
	if err := initSSHKeys(keyMan); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize ssh keys")
		return nil
	}

	return &Service{
		Machines: machManager,
		Keys:     keyMan,
	}
}

func (m *Service) NewSSHClient(machine *MachineOptions) (*ssh.Client, error) {
	auth, err := m.GetAuthMethod(machine)
	if err != nil {
		return nil, fmt.Errorf("failed to load auth method for host: %w", err)
	}

	return createSSHClient(machine, auth, m.SaveHostKey(machine.Name, *machine))
}

func (m *Service) SaveHostKey(name string, machine MachineOptions) func(hostname string, remote net.Addr, key ssh.PublicKey) error {
	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		log.Debug().Str("name", name).Msg("Empty public key for, public key will be saved on connect")

		comment := fmt.Sprintf("added by dockman for machine %s on %s", name, time.Now().String())
		stringKey, err := publicKeyToString(key, comment)
		if err != nil {
			return fmt.Errorf("unable to convert public key for machine %s: %w", name, err)
		}

		machine.RemotePublicKey = stringKey
		if err = m.Machines.Write(machine); err != nil {
			return err
		}

		return nil
	}
}

func (m *Service) GetAuthMethod(machine *MachineOptions) (ssh.AuthMethod, error) {
	if machine.UsePublicKeyAuth {
		return withKeyPairFromDB(m.Keys)
	} else if machine.Password != "" {
		return withPasswordAuth(machine), nil
	} else {
		// final fallback use .ssh in user dir
		// should fail on docker containers
		log.Debug().Str("client", machine.Name).Msg("falling back to SSH keys from home directory")
		return withKeyPairFromHome()
	}
}

func initSSHKeys(keyMan KeyManager) error {
	_, err := keyMan.GetKey(DefaultKeyName)
	if err == nil {
		return nil
	}

	// error occurred while getting default key generate new keys
	private, public, err := generateKeyPair()
	if err != nil {
		return err
	}

	err = keyMan.SaveKey(KeyConfig{
		Name:       DefaultKeyName,
		PublicKey:  public,
		PrivateKey: private,
	})
	if err != nil {
		return err
	}

	return nil
}
