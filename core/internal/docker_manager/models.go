package docker_manager

import (
	"github.com/RA341/dockman/internal/ssh"
	"github.com/docker/docker/client"
	ssh2 "golang.org/x/crypto/ssh"
)

type ManagedMachine struct {
	dockerClient *client.Client
	// this field is unused for now, intended to be used in: https://github.com/RA341/dockman/issues/25
	sshClient  *ssh2.Client
	sftpClient *ssh.SftpClient
}
