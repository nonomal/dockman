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
    - [Env Vars](#env-vars)
- [Roadmap](#roadmap)
- [Why](#why-dockman)
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
      - /path/to/dockman/config:/config
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
      - /var/run/docker.sock:/var/run/docker.sock
      - /home/zaphodb/stacks:/home/zaphodb/stacks

      # never mount this dir in your stacks
      - /home/zaphodb/appdata/dockman/config:/config
    ports:
      - "8866:8866"
    restart: always
```

### Env vars

Dockman can be customized through environment variables to suit your preferences.

When you launch a Dockman instance, a detailed configuration table will automatically appear in the startup logs. This
table provides:

* Configuration names
* Current values
* Descriptions
* Corresponding environment variable names

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
> Use `vX` for stability - guarantees your installation will always work
>
> Use `latest` for newest features - may contain breaking changes requiring manual intervention


#### Tags

| Tag Pattern | Description                          | Example  | Recommended For                                              |
|-------------|--------------------------------------|----------|--------------------------------------------------------------|
| `vX.Y.Z`    | Exact version                        | `v1.2.0` | Pin (No updates)                                             |
| `vX.Y`      | Latest patch for minor version       | `v1.2`   | Bug fixes                                                    |
| `vX`        | Latest minor/patch for major version | `v1`     | New features                                                 |
| `latest`    | Latest stable release                | `latest` | Always get the latest updates (May contain breaking changes) |
| `canary`    | Development builds                   | `canary` | Contributing/testing unreleased features                     |

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
    
- **Smart Updater** - Built-in container update management that replaces watchtower and diun. Choose between
  auto-updates or just get notified when updates are available
    
### 📋 Planned

- **Backup & Restore** - Complete backup and restore for your entire Docker setup, so you never lose
  your configs

Have ideas for new features?
[open an issue](https://github.com/RA341/dockman/issues/new) to share your suggestions!

## **Why Dockman**

I built Dockman to solve a workflow problem in my homelab.
While other Docker management tools exist, none matched how I actually wanted to work.

My previous setup was manually using scp to transfer compose files to my server after every change. The workflow
was tedious, but it had one major upside: I could edit configurations in my IDE where I'm most productive.

Dockman attempts to eliminate this friction while preserving what worked. 
You get the comfort of your local development environment with easy deployment for your homelab.

**Dockman is built for people who:**

* Edit configuration files directly rather than through GUI abstractions
* Want focused tools without feature bloat
* Value simplicity and reliability over comprehensive features

If this matches your workflow, I'd appreciate a star. If not, let me know what's missing.

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
> From [v2+](https://github.com/RA341/dockman/releases/tag/v2.0.0) onwards, hosts.yaml method is removed,
> in favour of a easier UI method

Dockman's multihost feature lets you manage remote Docker hosts from one centralized interface.
Jump between servers, keep your configurations perfectly organized, and deploy across your entire infrastructure
seamlessly.

### How It Works

```
                    ┌─────────────────────────────────┐
                    │        Dockman Instance         │
                    │                                 │
                    │  ┌───────────────────────────┐  │
                    │  │      Git Repository       │  │
                    │  │                           │  │
                    │  │  ┌─ main branch           │  │
                    │  │  ├─ host-a branch ────┐   │  │
                    │  │  ├─ host-b branch ────┼── ┼──┼─── docker-compose.yml
                    │  │  └─ host-c branch ────┘   │  │    .env files
                    │  │                           │  │    bind mount files
                    │  └───────────────────────────┘  │
                    └─────────────────┬───────────────┘
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                 Compose via API      │      Compose via API
                  + File Transfer     │       + File Transfer
                          │           │           │
                          ▼           ▼           ▼
                   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                   │   Host A    │ │   Host B    │ │   Host C    │
                   │             │ │             │ │             │
                   │ Docker      │ │ Docker      │ │ Docker      │
                   │ API/Daemon  │ │ API/Daemon  │ │ API/Daemon  │
                   │             │ │             │ │             │
                   │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │
                   │ │Container│ │ │ │Container│ │ │ │Container│ │
                   │ │ Stack   │ │ │ │ Stack   │ │ │ │ Stack   │ │
                   │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │
                   │             │ │             │ │             │
                   │ bind mounts │ │ bind mounts │ │ bind mounts │
                   │ (transferred│ │ (transferred│ │ (transferred│
                   │  from local)│ │  from local)│ │  from local)│
                   └─────────────┘ └─────────────┘ └─────────────┘
```

This architecture provides centralized management of all your remote Docker Compose setups from a single interface, with
all configurations version-controlled in Git. Dockman keeps your compose files local and sends them directly to the
remote Docker API, only transferring necessary bind mount files via SSH.

### Key Features

#### Agentless Architecture

```
    Dockman ──SSH + Docker API──> Remote Host
       │                            │
       │                            ├─ No agents installed
       │                            ├─ No background processes  
       │                            ├─ Compose files never transferred
       └─ Local compose files       └─ Only bind mounts transferred
         sent via Docker API
```

No bloated agents cluttering your servers—Dockman keeps it clean with **SSH-only connections** to the Docker API. Your
`docker-compose.yml` and `.env` files never leave your local machine.

Instead, Dockman sends the compose configuration directly to the remote Docker daemon via its API, only transferring the
specific bind mount files that your containers need.

**What gets transferred vs. what stays local:**

```yaml
# docker-compose.yaml -> (sent to Docker daemon directly)
services:
  nginx:
  image: nginx
  environment_file:
    - .env # -> (sent to Docker daemon directly)
  volumes:
    - ./config/nginx.conf:/etc/nginx/nginx.conf # -> automatically transferred via sftp
    - /home/zaphodb/data:/var/lib/data # -> this will not be transferred since its outside of compose root
```

#### Git-Based Configuration Management

Each host gets its own **Git branch** for complete isolation.
Modify one host's setup without affecting others.

When you switch hosts, Dockman automatically:

- Saves your current work on branch
- Switches to the target host's branch
- Connects to the remote server
- Loads the host-specific configuration

Your Docker Compose files, environment variables,
and deployment settings stay perfectly isolated per host,
while still allowing you to sync configurations between branches when needed.

```
Compose Root/
├── local/ <- git branch for local docker
│   ├── docker-compose.yml
│   ├── .env
│   └── config.yaml
│
├── apollo/ <- git branch for host: apollo
│   ├── .env
│   ├── README.md
│   ├── caddy/
│   │   ├── docker-compose.yml
│   │   ├── Caddyfile
│   │   └── .env
│   ├── calibre/
│   │   ├── docker-compose.yml
│   │   ├── config.json
│   │   └── .env
│   └── prometheus/
│       ├── docker-compose.yml
│       ├── prometheus.yml
│       └── rules.yml
│
├── ares/  <- git branch for host: ares
│   ├── .env
│   ├── README.md
│   ├── docker-compose.yml
│   ├── grafana/
│   │   ├── docker-compose.yml
│   │   ├── provisioning/
│   │   │   └── dashboards/
│   │   │       └── default.json
│   │   └── grafana.ini
├── artemis/ <- git branch for host artemis
│   ├── .env
│   ├── README.md
│   ├── docker-compose.yml
│   ├── node-exporter/
│   │   ├── docker-compose.yml
│   │   └── config.yaml
│   └── settings.json

```

### Prerequisites

1. **SSH Access**: SSH connectivity to all target Docker hosts
    - SSH user should be in the `docker` group for daemon access

2. **Docker Access**: SSH user must have Docker daemon access without requiring root
   ```bash
   # Add user to docker group on remote hosts
   sudo usermod -aG docker $USER
   ```

3. **Network Connectivity**: Docker daemon running on remote hosts with network access from Dockman instance

4. Ensure you have added the following mounts in your docker-compose.yml:
    ```yaml
    name: dockman
    services:
      dockman:
        container_name: dockman
        image: ghcr.io/ra341/dockman:latest
        environment:
          - DOCKMAN_COMPOSE_ROOT=/path/to/stacks
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock
          - /path/to/dockman/config:/config
        ports:
          - "8866:8866"
        restart: always
    ```

### Add Hosts via Web UI

1. **Navigate to the Settings page by clicking the settings icon on the top right** and click "Add New Machine"

2. **Configure your host** with the following fields:
    - <img height="300" alt="image" src="https://github.com/user-attachments/assets/7ef19e3a-0589-4ca5-b6f8-fe479c711375" />
    - **Name**: A friendly name for your host (e.g., "apollo", "production-server")
    - **Host**: IP address or hostname of your Docker host
    - **Port**: SSH port (default: 22)
    - **User**: SSH username that has Docker access
    - **Enable Machine**: Toggle to enable/disable this host
    - **Authentication**: Choose between Password or Public Key authentication

### Authentication Methods

#### 1. SSH Keys (Recommended)

- Toggle **"Public Key"** to enabled
- Dockman generates its own SSH key pair when it first runs
- **Automatic Key transfer**: Dockman will automatically copy the public key to your target host during the initial
  connection
- These are separate from your personal SSH keys in `~/.ssh/`

#### 2. Password Authentication

- Toggle **"Public Key"** to disabled
- Enter your password in the **Password** field
- Your password will be stored and used for subsequent connections

### Legacy Configuration (Deprecated)

**Migration from hosts.yaml:**

For users coming from v1, following are the steps to miagrate away from hosts.yaml

1. Remove the `./hosts.yaml:/app/config/hosts.yaml` volume mount from docker-compose
2. Remove the `./config/ssh/` volume mount from docker-compose
3. Reconfigure your hosts through the web UI

```yaml
# docker compose sample
name: dockman
services:
  dockman:
    container_name: dockman
    image: ghcr.io/ra341/dockman:latest
    environment:
      - DOCKMAN_COMPOSE_ROOT=/path/to/stacks
    volumes:
      # these mounts can now be removed
      # - ./config/ssh:/app/config/ssh
      # - ./hosts.yaml:/app/config/hosts.yaml

      # 4️⃣ NEW: Mount config directory for database storage
      # DO NOT store this in dockman compose root
      - /path/to/dockman/config:/config
    ports:
      - "8866:8866"
    restart: always
```

> [!WARNING]
> The `hosts.yaml` configuration method is **deprecated** as
> of [v2.0.0](https://github.com/RA341/dockman/releases/tag/v2.0.0) and has been removed.
> For v2+, use the web UI method described above.
>
> This is only available in [v1](https://github.com/RA341/dockman/releases/tag/v1.1.0) and below

For reference, the old `hosts.yaml` structure was:

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
  ares:
    enable: true
    host: 10.0.1.100
    port: 2222
    user: deploy
    password: someSecretPassword
    use_public_key_auth: false
```

## Security Considerations

### **AKA Don't Be a Dumb Dumb**

### Exposing Dockman

#### Why Exposing Dockman to the Internet Is a Terrible Idea

Dockman has access to your Docker socket, which is essentially root access to your entire system. One compromised
Dockman instance means a bad day for you.

It gets worse if you're using Dockman to manage remote Docker hosts. Since it connects via SSH, a breach doesn't just
compromise one server it potentially compromises every connected machine in your setup.

#### How to Secure Dockman

Keep dockman local only. It's designed for your private network, not the wild west of the internet. When you need remote
access, use a VPN like [Netbird](https://netbird.io/) or [Tailscale](https://tailscale.com/) to securely tunnel into
your network.

Also, enable Dockman's built-in authentication. On a private network, this gives you sufficient protection for most home
setups without making things overly complicated.

### **Git Repository Security**

#### Why Secrets in Git Are Usually Bad (But OK Here)

Your dockman repo breaks the usual rules about secrets in git repositories, and that's intentional. Unlike most
projects, this repository lives permanently on your homelab server, which changes everything about secret management.

Git makes secret tracking easier here. When you update your Plex API key or database password and something
breaks, you can roll back to the previous working configuration. Since this isn't a collaboration repo, the typical
concerns about team access don't apply.

#### How People Usually Mess This Up

The stories about secrets in git involve one mistake: pushing to public repositories. Don't accidentally commit
API keys to public GitHub repos. If you need remote backup, use private self-hosted solutions
like [Gitea](https://about.gitea.com/) on a VPS.

#### What Works

Keep secrets directly in your local repository; it makes change tracking easier. Your homelab repo should never touch
public services like GitHub or GitLab.

If you prefer .env files with `.gitignore`, that works too; dockman doesn't enforce any particular convention.

## Feedback

If you spot a bug, have an idea for a feature, or just want to share your thoughts, please open an [discussion](https://github.com/RA341/dockman/discussions) any and all
feedback is welcome.

I'd especially love to hear what you think about:

* The UI
    * I'm not a UI guy; in fact, I hate HTML/CSS in general. The current interface is mostly built using Material-UI
      and Gemini and designed for my preferences.
    * If you have ideas on how to make it look better or easier to use, I'm all ears. Feel free to open an [discussion](https://github.com/RA341/dockman/discussions) with
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
  > Using [uutils/coreutils](https://github.com/uutils/coreutils) as a temporary workaround
  until [Taskfile cross-platform shell support](https://github.com/go-task/task/issues/197#issuecomment-3014045749)
  added

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
