<div align="center">
  <img src=".github/img/drawing.svg" alt="Logo" width="200" height="200">
  <h1>Dockman</h1>
  <p>
    Dockman is a tool designed to simplify the management of Docker Compose files, particularly for homelab environments. It provides a straightforward way to edit, track, and back up your compose configurations.
  </p>
  <img src="https://github.com/user-attachments/assets/b29be7fd-15fb-4584-8136-d44a1a0acf25" alt="Dockman Demo" width="800">
</div>

## Contents

- [Install](#install)
    - [Config](#config)
- [Roadmap](#roadmap)
- [Why](#why-dockman)
    - [How It Compares](#how-it-compares)
- [File Layout](#file-layout)
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
> The stacks directory path must be absloute and identical in all three locations:
>
> * 1️⃣ Environment variable: `DOCKMAN_COMPOSE_ROOT=/path/to/stacks`
> * 2️⃣ The host side of the volume `/path/to/stacks`
> * 3️⃣ The container side of the volume `/path/to/stacks`
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

Dockman can be configured using environment variables to customize
its behavior according to your needs.

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

> [!NOTE]
> Example Image
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

### Docker Tags

Dockman follows [semver](https://semver.org/) and tags its image as such.

You can pin a dockman version using specific version tags

Find all available tags [here](https://github.com/RA341/dockman/pkgs/container/dockman)

> [!TIP]
> We recommend using (`latest`) or (`vX`)

#### Tags

| Tag Pattern | Description                          | Example  | Recommended For                          |
|-------------|--------------------------------------|----------|------------------------------------------|
| `vX.Y.Z`    | Exact version                        | `v1.2.0` | Pin (No updates)                         |
| `vX.Y`      | Latest patch for minor version       | `v1.2`   | Bug fixes                                |
| `vX`        | Latest minor/patch for major version | `v1`     | New features                             |
| `latest`    | Latest stable release                | `latest` | Always get the latest updates            |
| `dev`       | Development builds                   | `dev`    | Contributing/testing unreleased features |

```bash
# Pin to a specific version
docker pull ghcr.io/ra341/dockman:v1.2.0

# Pin to a major.minor version (gets latest bug fixes)
docker pull ghcr.io/ra341/dockman:v1.2

# Pin to a major version (gets latest feature updates)
docker pull ghcr.io/ra341/dockman:v1

# Use latest stable release
docker pull ghcr.io/ra341/dockman:latest

# Use development build (unstable)
docker pull ghcr.io/ra341/dockman:dev
```

#### Docker Compose Example

```yaml
version: '3.8'
services:
  dockman:
    image: ghcr.io/ra341/dockman:v1.2.0  # Pin to specific version
    container_name: dockman
    ports:
      - "8866:8866"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

## Getting Help

Need assistance? Open a [discussion on GitHub](https://github.com/RA341/dockman/discussions).

## Roadmap

### ✅ Completed

- **Version Control** - Built-in Git support automatically tracks changes to your compose files,
  maintaining a complete version history with easy rollback capabilities for configuration management
    - Released: [v1.0](https://github.com/RA341/dockman/releases/tag/v1.0.0)

- **Multi-Host Support** - Multihost docker support, enabling distributed container deployments while maintaining
  centralized
  configuration management and monitoring
    - Released: [v1.1](https://github.com/RA341/dockman/releases/tag/v1.1.0)

### 🚀 Active Development

- **Enhanced Development Experience** - Integrated Language Server Protocol support with intelligent autocompletion,
  syntax validation, and specialized Docker Compose features including port conflict detection and automatic network
  creation assistance
    - Status: [In Progress](https://github.com/RA341/dockman/issues/8)

### 📋 Planned

- **Backup & Restore** - Streamlined backup and restore operations for your entire Docker Compose infrastructure using
  Git-based snapshots,
  ensuring your configurations are always recoverable
    - Status: TBA

Have ideas for new features?
[open an issue](https://github.com/RA341/dockman/issues/new) to share your suggestions!

## Why Dockman

I built Dockman to solve a specific problem in my homelab setup.
While there are excellent Docker management tools available, none quite matched how I prefer to work.

Before Dockman, I had a repository of my compose files that I had to manually scp to my server with every change.
The workflow was cumbersome, but it let me work in my IDE to edit configurations,
and that was the one redeeming quality of this workflow.

I wanted a tool that let me stay in my IDE but got rid of the tedious remote update process. Dockman aims to bridge that
gap,
giving you the best of both worlds, the comfort of your local development environment with the easy deployment.

Dockman is designed for people who:

- Prefer editing configuration files directly over GUI abstractions
- Want a clean, focused interface without unnecessary complexity
- Value simplicity and purpose over comprehensive feature sets

If this resonates with your workflow, I'd appreciate a star.
Even if it doesn't fit your needs, I'd welcome your [feedback](#feedback) to help improve it.

### How It Compares

**vs. [Portainer](https://github.com/portainer/portainer)**: Dockman delivers a focused, minimalist experience designed
for homelabs. If you find Portainer's extensive feature set overwhelming and prefer a streamlined interface dedicated
specifically to compose file management, Dockman might be your solution.

**vs. [Dockge](https://github.com/louislam/dockge)**: The fundamental difference lies in editing philosophy. Dockman
embraces direct compose file editing, like working with your favorite text editor. Instead of UI-generated code, you get
hands-on control over your configurations.

The project takes inspiration from both these excellent tools.

## File Layout

Dockman keeps things simple with a flat-ish structure that makes sense for homelab setups.

### The Rules

- **No nested folders** - You can create folders in the root directory, but that's it. No folders inside folders.
- **Think startup-only** - Any file in dockman should only be needed when your containers start up. Think
  `compose.yaml`, `.env` files, and initial config files.
- **Keep data separate** - Application data like databases, logs, or user-generated content doesn't belong here. Mount
  those elsewhere.

### The Philosophy

Your compose setup should be a clean collection of:

- Core `compose.yaml` files
- Supporting `.env` files
- configuration files

That's it. If your container needs to write to it after startup, it probably doesn't belong in dockman.

### Example Structure

```
stacks/
├── .env # a global .env file that can be read by all compose files 
├── nextcloud/
│   ├── compose.yaml
│   ├── .env
│   └── config.php
├── traefik/
│   ├── compose.yaml
│   └── traefik.yml
└── media-compose.yaml # this file does not require any supporting files so it is placed at root
```

Think this is too limiting? Open an [issue](https://github.com/RA341/dockman/issues) and we can argue about it.

## Multihost Support

> [!IMPORTANT]
>
> This is now available in [v1.1+](https://github.com/RA341/dockman/releases/tag/v1.1.0)
>
> Ensure you are on [v1.1 tag](https://github.com/RA341/dockman/pkgs/container/dockman/454581385?tag=v1.1),
> or on [latest tag](https://github.com/RA341/dockman/pkgs/container/dockman/454581385?tag=latest)

Dockman's multihost feature lets you manage remote docker hosts from one interface.
Jump between servers, keep your configurations perfectly organized,
and deploy across your machines.

### How It Works

#### Agentless Architecture

No bloated agents cluttering your servers, Dockman keeps it clean with **SSH-only connections**.
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

### Getting Started

First, create an empty `hosts.yaml` file before running docker-compose
> [!CAUTION]
> Docker-compose will create a directory instead if it doesn't exist,
> this will cause dockman to fail since it's expecting a file

```yaml
name: dockman
services:
  dockman:
    container_name: dockman
    image: ghcr.io/ra341/dockman:latest
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

### Configuration

Basic `hosts.yaml` structure:

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

### Auth Methods (in order of priority)

1. **SSH Keys** - Set `use_public_key_auth: true` and copy your public key:
   ```bash
   ssh-copy-id -i ./config/ssh/id_rsa.pub user@host
   ```

   Dockman generates its own SSH key pair in `./config/ssh/` when it first runs. These are separate from your personal
   SSH keys in `~/.ssh/`. The container uses these dedicated keys for all remote connections.

2. **Password** - If `use_public_key_auth: false` then dockman uses `password: yourpassword`

3. **Host SSH Config** - If both `use_public_key_auth: false` and `password` is empty, then dockman falls back to your
   personal `~/.ssh` config.

> [!CAUTION]
> **Host SSH Config** method is intended for local development when running Dockman directly (not in Docker).
> Inside a Docker container, this behavior is undefined and will likely fail
> since the container doesn't have access to your user's SSH directory.

### Multiple Machines Example

```yaml
default_host: apollo # apollo will be the default connecting machine 
enable_local_docker: true # load the local client mounted at /var/run/docker.sock
machines:
  apollo:
    enable: true
    host: 192.169.69.0
    port: 22
    user: root
    use_public_key_auth: true

  ares:
    enable: true
    host: 10.0.1.100
    port: 2222
    user: deploy
    password: someSecretPassword # this machine will use password auth
    use_public_key_auth: false

  artemis:
    enable: false  # disabled will not be loaded
    host: staging.example.com
    port: 22
    user: ubuntu
    use_public_key_auth: true
```

### Config Parameters

| Parameter             | Required | Description                      |
|-----------------------|----------|----------------------------------|
| `enable`              | Yes      | Enable/disable this machine      |
| `host`                | Yes      | IP or hostname                   |
| `port`                | Yes      | SSH port (usually 22)            |
| `user`                | Yes      | SSH username                     |
| `password`            | No       | Password for auth                |
| `use_public_key_auth` | Yes      | Use SSH keys instead of password |
| `remote_public_key`   | No       | Auto-populated, don't touch      |

> [!IMPORTANT]
> The `remote_public_key` field gets filled automatically when you connect.
>
> NEVER MODIFY THIS FIELD MANUALLY AS IT MAY BREAK AUTH

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

### **AKA Don't Be a Dumb Dumb**

### Exposing Dockman

#### Why Exposing Dockman to the Internet Is a Terrible Idea

Dockman has access to your Docker socket, which is essentially root access to your entire system. One compromised
dockman instance means a bad day for you.

It gets worse if you're using dockman to manage remote Docker hosts. Since it connects via SSH, a breach doesn't just
compromise one server, it potentially compromises every connected machine in your setup.

#### How to Actually Secure Dockman

Keep dockman local only. It's designed for your private network, not the wild west of the internet. When you need remote
access, use a VPN like [Netbird](https://netbird.io/) or [Tailscale](https://tailscale.com/) to securely tunnel into
your network.

Turn on dockman's built-in authentication too. On a private network, this gives you sufficient protection for most home
setups without making things overly complicated.

### **Git Repository Security**

#### Why Secrets in Git Are Usually Bad (But OK Here)

Your dockman repo breaks the usual rules about secrets in git repositories, and that's intentional. Unlike most
projects, this repository lives permanently on your homelab server, which changes everything about secret management.

Git actually makes secrets tracking easier here. When you update your Plex API key or database password and something
breaks, you can roll back to the previous working configuration. Since this isn't a collaboration repo, the typical
concerns about team access don't apply.

#### How People Usually Mess This Up

The stories about secrets in git involve one mistake: pushing to public repositories. Don't accidentally commit
API keys to public GitHub repos. If you need remote backup, use private self-hosted solutions
like [Gitea](https://about.gitea.com/) on a VPS.

#### What Actually Works

Keep secrets directly in your local repository, it makes change tracking easier. Your homelab repo should never touch
public services like GitHub or GitLab.

If you prefer .env files with `.gitignore`, that works too, dockman doesn't enforce any particular convention.

## Feedback

If you spot a bug, have an idea for a feature, or just want to share your thoughts, please open an issue any and all
feedback is welcome.

I'd especially love to hear what you think about a couple of things:

* The UI
    * I'm not a UI expert, in fact I hate HTML/CSS in general. The current interface is mostly built using Material-UI
      and Gemini.
    * If you have ideas on how to make it look better or easier to use, I'm all ears. Feel free to open an issue with
      your suggestions.

## Contributing

Thanks for wanting to help make this project better! Here's everything you need to know to get up and running.

Whether you're fixing a bug, adding a feature, or improving documentation:

1. **Start with an issue** - Open an issue first to discuss your idea
2. **Fork and branch** - Create a feature branch from `main`
3. **Submit a PR** - Include a clear description of what you've changed

Dockman is built with Go for the backend and React for the frontend.

### Project Structure

- **[backend](core)**: The Go backend service
    - **[spec](spec)**: Proto files for the Connect-RPC API [more info](spec/readme.md).
- **[frontend](ui)**: The React frontend application
- **[install](install)**: Installation scripts and documentation (WIP)

### What You'll Need

Before diving in, make sure you have these installed:

- **Go 1.24+**
- **Node.js 22+** and npm/yarn
- **Docker** (I mean... DUH!) for testing and updating generated code

### The Setup

#### Step 1: Build the Frontend First

The Go server expects a frontend bundle to be ready before it'll start.

You won't actually use this build for development - it's just to keep the server happy.

```bash
cd ui
npm install
npm run build
```

#### Step 2: Fire Up the Backend

Now let's get that Go server running:

```bash
cd core/
```

You'll need to point it to your frontend build from step 1.
and tell it where to place the compose files:

This command creates a dir named stacks at project root

```bash
go run cmd/server/main.go --ui=../ui/dist --cr="../stacks"
```

> [!TIP]
> If it looks like it's hanging, don't panic!
>
> Go compilation can take a few seconds. Grab a coffee

The Backend will be accessible at http://localhost:8866

#### Step 3: Start the Dev Frontend

Open a new terminal (the backend needs to stay running):

```bash
cd ui
npm run dev
```

The frontend will be accessible at http://localhost:5173

> [!IMPORTANT]
> The frontend needs the backend running to work properly,
> so make sure step 2 is done first!
>
> If the server is down, you will get a bunch of error messages on the frontend

#### Quick Reference

Once everything is running:

- **Backend**: Usually runs on port 8866 (check the terminal output)
- **Frontend Dev Server**: Usually runs on port 5173 (check the terminal output)
- **Docker Compose Root**: The `../stacks` directory (you can change this with the `--cr` flag)

#### Common Issues & Solutions

- **"Frontend won't load"**: Make sure the backend is running first
- **"Go server won't start"**: Check if you built the frontend (`npm run build` in the ui directory)
- **"Something broke"**: Try turning it off and on again (seriously, restart both servers)

### Development Workflow

1. Make your changes in the `ui/` directory
2. The dev server will auto-reload for most changes
3. For backend changes, you'll need to restart the Go server
4. Test with real Docker containers to make sure everything works

### Need Help?

Not sure where to start? Open an issue tagged with `question` or `help wanted`.

I'm happy to help guide new contributors through the codebase.

If you get stuck, don't hesitate to:

- Open an issue with your problem
- Ask questions in the discussions
- Tag me (@RA341) if you need clarification on anything

Happy coding!

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE v3.0. See the [LICENSE](LICENSE) file for details.
