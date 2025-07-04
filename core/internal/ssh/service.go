package ssh

import (
	"fmt"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/ssh"
	"net"
	"os"
	"path/filepath"
	"time"
)

type Service struct {
	Config       *ConfigManager
	sshKeyFolder string
}

func NewService(basedir string) *Service {
	sshDir, err := initSSHDir(basedir)
	if err != nil {
		log.Fatal().Err(err).Msg("unable to initialize ssh dir")
	}

	configManager, err := NewConfigManager(basedir)
	if err != nil {
		log.Fatal().Err(err).Msg("unable load host config")
	}

	return &Service{
		Config:       configManager,
		sshKeyFolder: sshDir,
	}
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
		if err = m.Config.WriteAndSave(name, machine); err != nil {
			return err
		}

		return nil
	}
}

func (m *Service) GetAuthMethod(name string, machine *MachineOptions) (ssh.AuthMethod, error) {
	if machine.UsePublicKeyAuth {
		return withKeyPairAuth(m.sshKeyFolder)
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
