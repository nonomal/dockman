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

Access at http://localhost:8866

### Docker Compose

> [!IMPORTANT]
>
> The stacks directory path must be absolute and identical in all three locations:
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

Dockman can be customized through environment variables to better suit your workflow.

When you launch a Dockman instance, a detailed configuration table will automatically appear in the startup logs. This
table provides:

* Configuration names
* Current values
* Descriptions
* Corresponding environment variable names (if applicable)

To see all available configuration options for your specific version, refer to this table in the startup logs.

> [!NOTE]
> **Example Output**
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

Find all available tags
[here](https://github.com/RA341/dockman/pkgs/container/dockman/versions?filters%5Bversion_type%5D=tagged)

> [!TIP]
> We recommend using (`vX`) or (`latest`)

#### Tags

| Tag Pattern | Description                          | Example  | Recommended For                                              |
|-------------|--------------------------------------|----------|--------------------------------------------------------------|
| `vX.Y.Z`    | Exact version                        | `v1.2.0` | Pin (No updates)                                             |
| `vX.Y`      | Latest patch for minor version       | `v1.2`   | Bug fixes                                                    |
| `vX`        | Latest minor/patch for major version | `v1`     | New features                                                 |
| `latest`    | Latest stable release                | `latest` | Always get the latest updates (May contain breaking changes) |
| `dev`       | Development builds                   | `dev`    | Contributing/testing unreleased features                     |

#### Docker Compose Example

```yaml
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

- **Version Control** - Built-in Git support that automatically tracks changes to your compose files and lets you easily
  roll back when things go wrong
    - Released: [v1.0](https://github.com/RA341/dockman/releases/tag/v1.0.0)

- **Multi-Host Support** - Deploy containers across multiple hosts while keeping everything managed from one place, with
  isolated configs per host
    - Released: [v1.1](https://github.com/RA341/dockman/releases/tag/v1.1.0)

### 🚀 Active Development

- **Editor LSP** - Smart autocompletion, syntax checking, formatter and custom Docker Compose helpers like port
  conflict detection and auto network setup
    - Status: [In Progress](https://github.com/RA341/dockman/issues/8)

- **Smart Updater** - Built-in container update management that replaces watchtower and diun. Choose between
  auto-updates or just get notified when updates are available
    - Status: [In Progress](https://github.com/RA341/dockman/issues/30)

### 📋 Planned

- **Backup & Restore** - Complete backup and restore for your entire Docker setup, so you never lose
  your configs
    - Status: TBA

Have ideas for new features?
[open an issue](https://github.com/RA341/dockman/issues/new) to share your suggestions!

## **Why Dockman**

I built Dockman to solve a frustrating workflow problem in my homelab. While other Docker management tools exist,
none matched how I actually wanted to work.

My previous setup required manually using scp to transfer compose files to my server after every change. The workflow
was tedious, but it had one major upside: I could edit configurations in my IDE where I'm most productive.

Dockman eliminates the friction while preserving what worked. You get the comfort of your local development environment
with easy deployment for your homelab.

**Dockman is built for people who:**

* Edit configuration files directly rather than through GUI abstractions
* Want focused tools without feature bloat
* Value simplicity and reliability over comprehensive features

If this matches your workflow, I'd appreciate a star. If not, let me know what's missing.

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

Dockman is built with Go for the backend and React for the frontend.

### Project Structure

- **[backend](core)**: The Go backend service
    - **[spec](spec)**: Proto files for the Connect-RPC API [more info](spec/readme.md).
- **[frontend](ui)**: The React frontend application
- **[install](install)**: Installation scripts and documentation (WIP)

### What You'll Need

Before diving in, make sure you have these installed:

- **[Go 1.24+](https://go.dev/dl/)**
- **[Node.js 22+](https://nodejs.org/en/download/)** and npm/yarn
- **[Docker](https://www.docker.com/products/docker-desktop/)** (I mean... DUH!) for testing and updating generated code
- **[Taskfile](https://taskfile.dev/#/installation)** – a modern task runner used for automating development workflows (
  like Make, but nicer)
- **[Coreutils](https://uutils.github.io/coreutils/docs/installation.html)** – used to perform cross-platform file
  operations, since Taskfile doesn't yet support platform-agnostic shell commands
  > _Using [uutils/coreutils](https://github.com/uutils/coreutils) as a temporary workaround
  pending [Taskfile cross-platform shell support](https://github.com/go-task/task/issues/197#issuecomment-3014045749)_

### Init

The easiest way to get started is with our init task that handles everything:

```bash
task init
```

This single command will:

- Create the build directory
- Install npm dependencies
- Build the frontend
- Run `go mod tidy`

### Frontend Development Server

Start the UI development server with hot reload capabilities:

```bash
task ui:r
```

This command runs `npm run dev` in the `ui` directory. The frontend will be accessible at http://localhost:5173 with
automatic hot reload for development.

### Backend Development Server

Open a new terminal window (keep the frontend server running):

```bash
task go:develop
```

This command will:

- Build a Go binary server in the `build/develop` directory
- Create a `develop/` folder structure containing:
    - `compose/` - Docker Compose root directory for all compose files
    - `config/` - Configuration directory containing the SQLite database

The backend will be accessible at http://localhost:8866

**Note:** Go does not support hot reload. To apply code changes, stop the server and rerun the `task go:develop` command
to rebuild with your updates.### Available Task Commands

You can see all available tasks by running:

```bash
task --list
```

#### Common Development Tasks

- **`task init`** - Complete setup for new contributors
- **`task ui`** - Build the frontend
- **`task ui:dep`** - Install UI dependencies
- **`task go:server`** - Build and run the server
- **`task go:b:server`** - Build server binary only
- **`task clean`** - Remove all build files
- **`task tidy`** - Run `go mod tidy` in the core directory

#### Building Specific Components

Build any Go command using the pattern `task go:b:<target>`:

```bash
task go:b:server    # Build server
task go:b:updater   # Build updater
```

Run any Go command using the pattern `task go:<target>`:

```bash
task go:server      # Build and run server
task go:updater     # Build and run updater
```

#### Docker Tasks

- **`task dk:b:<target>`** - Build Docker image for specific target
- **`task dk:<target>`** - Build and run Docker image
- **`task dk:up`** - Build the updater image
- **`task dk:upr`** - Build and run the updater image
- **`task dk:prune`** - Clean up Docker images

#### UI-Specific Tasks

- **`task ui:native`** - Build UI and copy for native binary embedding

### Development Workflow

#### For Frontend Development

1. Run `task init` for initial setup
2. Start backend: `task go:server`
3. Start frontend dev server: `cd ui && npm run dev`
4. Make your changes in the `ui/` directory
5. The dev server will auto-reload for most changes

#### For Backend Development

1. Run `task init` for initial setup
2. Make your changes in the `core/` directory
3. Rebuild and restart: `task go:server`
4. Test with real Docker containers

#### For Full Stack Development

1. Run `task init` for initial setup
2. Use `task ui:native` to rebuild UI for native embedding
3. Rebuild backend: `task go:b:server`
4. Test the integrated application

### Quick Reference

Once everything is running:

- **Backend**: Usually runs on port 8866 (check the terminal output)
- **Frontend Dev Server**: Usually runs on port 5173 (check the terminal output)
- **Docker Compose Root**: The `../stacks` directory (you can change this with the `--cr` flag)
- **Build Output**: All binaries go to the `build/` directory

#### Common Issues & Solutions

- **"Frontend won't load"**: Make sure the backend is running first
- **"Go server won't start"**: Check if you built the frontend with `task ui`
- **"Task not found"**: Make sure you have Taskfile installed and are in the project root
- **"Coreutils command not found"**: Install uutils coreutils as mentioned in the requirements
- **"Something broke"**: Try `task clean` followed by `task init` to start fresh

#### Git ops

Whether you're fixing a bug, adding a feature, or improving documentation:

1. **Start with an issue** - Open an issue first to discuss your idea
2. **Fork and branch** - Create a feature branch from `main`
3. **Make your changes** - Use the task commands for consistent builds
4. **Test thoroughly** - Use both `task go:server` and Docker builds to test
5. **Submit a PR** - Include a clear description of what you've changed

### Need Help?

Not sure where to start? Open an issue tagged with `question` or `help wanted`.

I'm happy to help guide new contributors through the codebase.

If you get stuck, don't hesitate to:

- Open an issue with your problem
- Ask questions in the discussions
- Tag me (@RA341) if you need clarification on anything
- Run `task --list` to see all available commands

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE v3.0. See the [LICENSE](LICENSE) file for details.
