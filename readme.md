<div align="center">
  <img src=".github/img/drawing.svg" alt="Logo" width="200" height="200">
  <h1>Dockman</h1>
  <p>
    Dockman is a tool designed to simplify the management of Docker Compose files, particularly for homelab environments. It provides a straightforward way to edit, track, and back up your compose configurations.
  </p>
</div>

![dockmanv1](https://github.com/user-attachments/assets/a927aba2-fe96-44ee-b194-bdaab9436948)

## Contents

- [Install](#install)
    - [Config](#config)
- [Why](#why-dockman)
    - [Planned Features](#planned-features)
    - [How It Compares](#how-it-compares)
- [Multihost support](#multihost-support)
- [Feedback](#feedback)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Install

### Quick Start

Try Dockman with this single command:

> [!NOTE]
> This quick-start command will **delete all dockman data** when the container stops. Use only for testing.
>
> For a more persistent setup, see the [compose](#docker-compose) section below.

```bash
docker run --rm -p 8866:8866 -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/ra341/dockman:latest
```

Access the frontend at http://localhost:8866

### Docker Compose

> [!IMPORTANT]
>
> The stacks directory path must be identical in all three locations:
>
> * 1️⃣ Environment variable: `DOCKMAN_COMPOSE_ROOT=/path/to/stacks`
> * 2️⃣ The host side of the volume `/path/to/stacks`
> * 3️⃣ The container side of the volume `/path/to/stacks)`
>
> This path consistency is essential for Dockman to locate and manage your compose files properly.

```yaml
services:
  dockman:
    container_name: dockman
    image: ghcr.io/ra341/dockman:latest
    environment:
      # 1️⃣
      - DOCKMAN_COMPOSE_ROOT=/path/to/stacks
    volumes:
      #  2️⃣              3️⃣                
      - /path/to/stacks:/path/to/stacks
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "8866:8866"
    restart: always
```

#### Example with Actual Path

Replace `/path/to/stacks` with your actual directory path:

```yaml
services:
  dockman:
    container_name: dockman
    image: ghcr.io/ra341/dockman:latest
    environment:
      - DOCKMAN_COMPOSE_ROOT=/home/zaphodb/stacks
    volumes:
      - /home/zaphodb/stacks:/home/zaphodb/stacks
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "8866:8866"
    restart: always
```

### Config

Dockman can be configured using environment variables to customize its behavior according to your needs.

When you start a Dockman instance, a comprehensive table of all 
available environment variables for your version will be
automatically printed in the startup logs.

This table includes:

- Config name
- The current set values
- Descriptions
- env variable names (where applicable)

For a complete list of available configuration options for your version,
refer to the environment variables table displayed in your startup logs

> Example Image,
> 
> ![Environment Variables Table](.github/img/env.png)

#### Setting Environment Variables

You can set environment variables directly in your compose file or import them via a .env file:

**Docker Compose:**

```yaml
dockman:
  image: ghcr.io/ra341/dockman:latest
  environment:
    - DOCKMAN_COMPOSE_ROOT=/home/docker/stacks
    - DOCKMAN_AUTH=true
```

**Environment File:**

```bash
# dockman.env
DOCKMAN_COMPOSE_ROOT=/home/docker/stacks
DOCKMAN_AUTH=true
DOCKMAN_AUTH_USERNAME=test
DOCKMAN_AUTH_PASSWORD=wow
```

```yaml
# dockman-compose.yaml
dockman:
  image: ghcr.io/ra341/dockman:latest
  env_file:
    - ./dockman.env
```

## Getting Help

Need assistance? Open a [discussion on GitHub](https://github.com/RA341/dockman/discussions).

## Why Dockman

I built Dockman to solve a specific problem in my homelab setup. While there are excellent Docker management tools available, none quite matched how I prefer to work.

Before Dockman, I had a repository of my compose files which I used to scp over to my server on every change—as exhausting as it sounds. 
But it let me work in my IDE to edit configurations, which was the one thing keeping me sane in this otherwise tedious workflow.

So I thought: what if I could keep my IDE workflow but ditch the manual file shuffling? Dockman bridges that gap, 
giving you the best of both worlds—the comfort of your local development environment with the power of effortless remote deployment.

Dockman is designed for people who:

- Prefer editing configuration files directly over GUI abstractions
- Want a clean, focused interface without unnecessary complexity
- Value simplicity and purpose over comprehensive feature sets

If this resonates with your workflow, I'd appreciate a star.
Even if it doesn't fit your needs, I'd welcome your [feedback](#feedback) to help improve it.

### Planned Features

* **Enhanced Development Experience:** Integrated Language Server Protocol (LSP) support provides intelligent
  autocompletion, syntax validation, and specialized Docker Compose features including port conflict detection and
  automatic network creation assistance.

* **Effortless Backup & Restore:** Streamlined backup and restore operations for your entire Docker Compose
  infrastructure using Git-based snapshots, ensuring your configurations are always recoverable.

* **Version Control Integration:** Built-in Git support automatically tracks changes to your compose files, maintaining
  a complete version history with easy rollback capabilities for configuration management.

* **Multi-Host Deployment:** Seamless orchestration across multiple hosts, enabling distributed container deployments
  while maintaining centralized configuration management and monitoring.

### How It Compares

**vs. [Portainer](https://github.com/portainer/portainer)**: Dockman delivers a focused, minimalist experience designed
for homelabs. If you find Portainer's extensive feature set overwhelming and prefer a streamlined interface dedicated
specifically to compose file management, Dockman might be your solution.

**vs. [Dockge](https://github.com/louislam/dockge)**: The fundamental difference lies in editing philosophy. Dockman
embraces direct compose file editing—like working with your favorite text editor. Instead of UI-generated code, you get
hands-on control over your configurations.

The project takes inspiration from both these excellent tools.

## Multihost Support
> [!IMPORTANT]
>
> This is now available in v1.1+; ensure you have the right version installed.

Dockman's multihost feature lets you manage remote docker hosts from one interface. 
Jump between servers, keep your configurations perfectly organized,
and deploy across your machines.

### How It Works

#### Agentless Architecture

No bloated agents cluttering your servers—Dockman keeps it clean with **SSH-only connections**. 
Just point it at your Docker hosts and watch the magic happen. All you need is SSH access.

#### Git-Based Configuration Management

Each host gets its own **Git branch**. Tweak one host's setup without breaking another's. 
When you switch hosts, Dockman automatically saves your work, hops to the right branch, 
and connects to your target server.

Your Docker Compose files, environment variables, and deployment settings stay perfectly isolated per host, 
but you can still sync configurations between branches.

### Prerequisites

1. **SSH Access**: SSH access to all target Docker hosts (recommended: public-private key auth)
2. **Docker Access**: SSH user must have Docker daemon access without requiring root
3. **Network**: Docker daemon running on remote hosts with network connectivity to Dockman

### Setup

Begin by creating `hosts.yaml` as a file before mounting the volume.

> [!CAUTION]
> If this file doesn't exist, Docker Compose will automatically create a directory with this name, causing the configuration to fail.

```yaml
name: dockman
services:
  dockman:
    container_name: dockman
    image: ghcr.io/ra341/dockman:dev
    environment:
      - DOCKMAN_COMPOSE_ROOT=/home/zaphodb/stacks
    volumes:
      - /home/zaphodb/stacks:/home/zaphodb/stacks
      - /var/run/docker.sock:/var/run/docker.sock
      - ./config/ssh:/app/config/ssh
      - ./hosts.yaml:/app/config/hosts.yaml
    ports:
      - "8866:8866"
    restart: always
```

#### Adding Machines

To configure additional machines in your YAML configuration file. This process involves defining connection details and authentication methods for each target system.

##### Structure

* `default_host`: set a default machine to automatically connect on startup
* `enable_local_docker`: use the local docker from env mounted using `/var/run/docker.sock:/var/run/docker.sock`

```yaml
default_host: local
enable_local_docker: true
machines:
  apollo:
    enable: true
    host: 192.169.69.0
    port: 22
    user: root
    use_public_key_auth: true
```

##### Required Information

Before adding a machine, collect the following details for each target system:

- **Host**: IP address or hostname of the target machine
- **Port**: SSH port (typically 22, though often changed for security purposes)
- **User**: Username for SSH connection (commonly `root`, `ubuntu`, or a dedicated service account)

##### Authentication Hierarchy

Dockman supports multiple authentication methods and attempts them in the following priority order:

1. **Public Key Authentication**: Enable by setting `use_public_key_auth: true`. This method requires transferring the SSH public key from `config/ssh/id_rsa.pub` to the remote machine's `authorized_keys` file.

2. **Password Authentication**: When `use_public_key_auth: false`, Dockman will attempt password-based authentication using the value specified in `password: somepassword`.

3. **Host Authentication**: If no password is provided, Dockman falls back to the SSH configuration in your machine's user directory (typically `~/.ssh`).
   > NOTE
   > This method only works with native executables and was intended for local development.
   >
   > It will fail when running in a Docker container.

### Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enable` | boolean | Yes | Controls whether this machine configuration is active |
| `host` | string | Yes | IP address or hostname of the target machine |
| `port` | integer | Yes | SSH port number (standard port is 22) |
| `user` | string | Yes | SSH username for establishing the connection |
| `password` | string | No | SSH password for authentication (if not using key-based auth) |
| `remote_public_key` | string | No | Automatically populated during connection - do not modify manually |
| `use_public_key_auth` | boolean | Yes | Enables public key authentication method |

#### Example: Adding Multiple Machines

```yaml
default_host: local
enable_local_docker: true
machines:
  apollo:
    enable: true
    host: 192.169.69.0
    port: 22
    user: root
    remote_public_key: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vX9j...
    use_public_key_auth: true
  
  ares: # The machines can be named whatever you want
    enable: true
    host: 10.0.1.100
    port: 2222
    user: deploy
    password: someSecretPassword # this machine will use password auth
    remote_public_key: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vX9j... # will be automatically set, NEVER MODIFY MANUALLY
  
  artemis:
    enable: false  # Temporarily disabled
    host: staging.example.com
    port: 22
    user: ubuntu
    remote_public_key: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vX9j...
    use_public_key_auth: true
```

#### Troubleshooting

**SSH Connection Failed:**

```bash
# Test SSH connection manually
ssh user@host-address

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
```

**Docker Daemon Not Accessible:**

```bash
# Verify Docker is running on remote host and accessible without root access
ssh user@host-address 'docker version'
```

## Security Considerations

### **Security Measures aka Don't Be a Dumb Dumb**:

- **Never expose dockman to the internet** - Seriously, don't be that person. Keep it isolated within your local network
- **Use VPN access only** - Use secure VPN services like Tailscale for remote access

### SSH Security Best Practices

- **Use SSH key authentication** instead of passwords
- **Restrict SSH access** to specific IP ranges
- **Rotate SSH keys regularly** and remove unused keys

### Git Repository Security (The "Oops I Leaked My Secrets" Prevention Guide)

- **Local config repos are fine** - It's okay to check secrets into your local configuration repository
- **Never push to untrusted remotes** - Don't push your secrets to GitHub, GitLab, or any public/untrusted remote
  server (your API keys don't need to be famous)
- **Always verify your push destination** - Double-check where you're pushing your repo before hitting enter.
- **Use private, secured repositories only** - If you must use a remote, ensure it's a private, properly secured
  repository that you control

## Feedback

This project is in early stages, so any and all feedback is a huge help.
If you spot a bug, have an idea for a feature, or just want to share your thoughts, please open an issue.

I'd especially love to hear what you think about a couple of things:

* The File and Folder Structure

* The UI
    * I'm not a UI expert, in fact I hate HTML/CSS in general. The current interface is mostly built using Material-UI
      and
      Gemini.
    * If you have ideas on how to make it look better or easier to use, I'm all ears. Feel free to open an issue with
      your suggestions.

## Contributing

Dockman is built with Go for the backend and React for the frontend.

### Project Structure

- **[backend](backend)**: The Go backend service
    - **[spec](spec)**: Proto files for the Connect-RPC API [more info](spec/readme.md).
- **[frontend](ui)**: The React frontend application
- **[install](install)**: Installation scripts and documentation (WIP)

### Getting Started

Before contributing, make sure you have:

- Go 1.24+ installed
- Node.js 22+ and npm/yarn
- Docker for testing/updating generated code

### How to Contribute

Whether you're fixing a bug, adding a feature, or improving documentation:

1. **Start with an issue** - Open an issue first to discuss your idea
2. **Fork and branch** - Create a feature branch from `main`
3. **Submit a PR** - Include a clear description of what you've changed

### Questions?

Not sure where to start? Open an issue tagged with `question` or `help wanted`. I'm happy to help guide new contributors
through the codebase.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
