package docker_manager

import (
	"github.com/RA341/dockman/internal/ssh"
	"github.com/docker/docker/client"
	ssh2 "golang.org/x/crypto/ssh"
)

type ManagedMachine struct {
	client     *client.Client
	sshClient  *ssh2.Client
	sftpClient *ssh.SftpClient
}
