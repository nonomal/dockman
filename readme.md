<div align="center">
  <img src=".github/img/drawing.svg" alt="Logo" width="200" height="200">
  <h1>Dockman</h1>
  <p>
    Dockman is a tool designed to simplify the management of Docker Compose files, particularly for homelab environments. It provides a straightforward way to edit, track, and back up your compose configurations.
  </p>
</div>

![dockmanv1](https://github.com/user-attachments/assets/a927aba2-fe96-44ee-b194-bdaab9436948)

## Contents

- [Install](#Install)
    - [Config](#config)
- [Why](#why-dockman)
    - [Planned Features](#planned-features)
    - [How It Compares](#how-it-compares)
- [Feedback](#feedback)
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

For a persistent installation, use Docker Compose with the configuration below.

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

### Example with Actual Path

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

#### Environment Variables

Dockman can be configured using environment variables to customize its behavior according to your needs.

#### Available Variables

When you start a Dockman instance, a comprehensive table of all available environment variables for your version will be
automatically printed in the startup logs.
This table includes:

- Config name
- The current set values
- Descriptions
- env variable names (where applicable)

For a complete list of available configuration options for your version,
refer to the environment variables table displayed in your startup logs

Example Image,

![Environment Variables Table](.github/img/env.png)

> [!NOTE]
>
> The available environment variables may vary between different versions of Dockman.
>
> Always check the startup logs for the most accurate and
> up-to-date configuration options for your specific version.

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
dockman:
  image: ghcr.io/ra341/dockman:latest
  env_file:
    - ./dockman.env
```

## Getting Help

Need assistance? Open a [discussion on GitHub](https://github.com/RA341/dockman/discussions).

## Why Dockman

I built Dockman to solve a specific problem in my homelab setup. While there are excellent Docker management tools
available, none quite matched how I prefer to work.

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
> This feature is currently unreleased, only available on develop tag
>
> ```
> ghcr.io/ra341/dockman:dev
> ```

Dockman supports managing multiple Docker hosts from a single instance,
allowing you to manage containers across different servers seamlessly.

This multihost feature enables you to manage Docker on remote servers,
switch between different hosts without losing configurations, maintain isolated configurations for each host,
and deploy and monitor across your entire infrastructure.

### How It Works

#### Agentless Architecture

Dockman uses an **agentless approach** with SSH connections to communicate with remote Docker hosts.

No additional software needs to be installed on remote servers—only SSH access is required to manage Docker daemons
securely.

#### Git-Based Configuration Management

Dockman leverages **Git branches** for configuration management,
with each host having its own dedicated branch.

This enables independent modifications where changes to one host don't affect others,
while still allowing configuration sync between branches when needed.

Each host maintains its own Docker Compose files, environment variables, service configurations,
and deployment settings.

When switching hosts, Dockman automatically saves changes to the current branch,
switches to the target host's branch, and connects to that host's Docker daemon.

### Prerequisites

Before setting up multihost:

1. **SSH Access**: SSH access to all target Docker hosts (recommended: public-private key auth)
2. **Docker Access**: SSH user must have Docker daemon access without requiring root
3. **Network**: Docker daemon running on remote hosts with network connectivity to Dockman

### Getting Started

TODO

### Troubleshooting

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

### Docker Daemon Access

**Critical Warning**: Granting access to the Docker daemon via `docker.sock` provides root-level access to the host
system.

**Don't Be a Dumb Dumb - Required Security Measures**:

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
- **Always verify your push destination** - Double-check where you're pushing your repo before hitting enter (measure
  twice, push once)
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
