<div align="center">
  <img src=".github/img/drawing.svg" alt="Logo" width="200" height="200">
  <h1>Dockman</h1>
  <p>
    A Docker management tool for users who want unfiltered access to their Docker Compose files, like having a specialized editor for your homelab that helps you manage and track your Docker setup.
  </p>
  <img src="https://github.com/user-attachments/assets/e1d17951-3b40-4833-b01c-c9c6d3f52d5a" alt="Dockman Demo" width="800">
</div>

## Contents

- [Install](#install)
    - [Env Vars](#env-vars)
- [Roadmap](#roadmap)
- [Why](#why-dockman)
- [Common Errors](#common-errors)
- [File Layout](#file-layout)
- [Env loading](#env-loading)
- [Updater](#dockman-updater)
- [Notifications](#notifications)
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

### 📋 Planned

- **Editor LSP** - Smart autocompletion, syntax checking, formatter and custom Docker Compose helpers like port
  conflict detection and auto network setup

- **Smart Updater** - Built-in container update management that replaces watchtower and diun. Choose between
  auto-updates or just get notified when updates are available

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

## Common errors

This section documents common errors you might encounter when using Dockman, along with their causes
and recommended fixes.

### Contents:

* [STAGING_LAG](#staging_lag)

### STAGING_LAG

Dockman times out while waiting for files to be staged with Git. This usually occurs when your compose directory
contains large files or folders (e.g., databases, media, or volumes) that slow down the git add process.

Dockman will only see top level directories but Git will attempt to load all files/folders at full depth regardless.

**Original issue:** [#40](https://github.com/RA341/dockman/issues/40)

* **Message:**
    ```
    CODE: [STAGING_LAG] Git timed out waiting for the staging operation, it took more than 5 seconds to add files.
    This is likely due to large files/folders in your compose root.
    To resolve this, refer to: https://github.com/RA341/dockman?tab=readme-ov-file#staging_lag
    ```

* **Cause:** By default, Dockman stages the entire stack directory for versioning. If there are large or unnecessary
  files (such as volume data, logs, or other artifacts) in your stacks folder, Git may become slow or unresponsive
  during the staging operation.

* **Solution:**
    * **Separate data from configuration:** Move large or dynamic files to a separate `data/` or `volumes/` folder
      outside the stack root.
        * **Example directory structure:**
            ```
            /home/zaphodb/docker/compose  ← use only to store your compose files and configs
            /home/zaphodb/docker/data     ← use only to store your docker container data
            ```
        * **Examples**
            * **❌ Wrong (causes STAGING_LAG):**
                ```yaml
                  postgres:
                    image: postgres:15
                    volumes:
                      - ./data/postgres:/var/lib/postgresql/data  # <- Large data inside compose root caused by './'
                      - ./logs:/var/log  # Log files inside compose root
                ```

            * **✅ Correct (avoids STAGING_LAG):**
              ```yaml
                postgres:
                  image: postgres:15
                  volumes:
                    - ../data/postgres:/var/lib/postgresql/data  # Data stored outside compose root
                    - ../logs:/var/log  # Logs stored outside compose root
                    # or with a full path
                    # - /home/zaphodb/docker/data/postgres/logs
                    # - /home/zaphodb/docker/data/postgres/data
                    - ./config/init.sql:/docker-entrypoint-initdb.d/init.sql  # keep simple Config files in compose root
              ```
    * **Keep stack root clean:** Only include Docker Compose files and relevant configuration files in your stack
      directory.
    * **Avoid .gitignore as a workaround**: While you can use .gitignore to exclude files, this is not recommended for
      Dockman. The better cleaner practice is to keep only relevant configuration files in your compose root and
      separate your
      stack definitions from your data directories entirely.
    * **See also:** [Recommended file layout](#file-layout) for best practices.

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

## Env Loading

Dockman can automatically discover and load environment files when running your compose setup.

> [!NOTE]
> **Only files named `.env` are supported.**

If the same variable is defined in multiple places, the value from the **higher-precedence** source will overwrite the
lower one. This makes it easy to override global defaults with project-specific settings.

Precedence (highest → lowest):

1. **Subfolder `.env`** - scoped to a specific compose folder
2. **Root `.env`** - global defaults for everything under the compose root
3. **OS env vars** - values already defined in your shell/OS environment

```text
compose-root/
 ├─ .env        (global)
 └─ subfolder/
     └─ .env    (overrides global)
```

> [!Note]
> These `.env` files are **only for Docker Compose interpolation**.
>
> They are not automatically transferred into the container.
>
> Only variables referenced with `${VAR}` in the compose file are substituted.

Example (interpolation only):

```yaml
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - ${TEST}:/var/somepath
      - ${ENVIRONMENT}:/anotherpath/
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  db_data:
```

In this example, `${TEST}` and `${ENVIRONMENT}` are resolved from `.env`
but are not injected into the container environment automatically.

### Adding Environment Variables to the Container

To actually pass environment variables into the container, you can:

**1. Pass them via `environment`:**

```yaml
services:
  app:
    image: myapp:latest
    environment:
      APP_ENV: ${ENVIRONMENT} # <- docker compose will replace these before parsing the compose file
      DEBUG: ${DEBUG} 
```

**2. Or use the `env_file`:**

```yaml
services:
  app:
    image: myapp:latest
    env_file:
      - ./.env # load sub dir env file
```

Where `.env` might look like:

```dotenv
ENVIRONMENT=production
DEBUG=false
```

## Dockman Updater

> [!IMPORTANT]
> Dockman updater is only available on ```ghcr.io/ra341/dockman:main``` tag only
>
> and is currently in testing expect bugs

Dockman provides a Docker container and image updater, serving as a complete replacement for
Watchtower.

### Features

- **Automated Updates**: Keep your containers running the latest versions automatically
- **Flexible Notification System**: Choose to receive notifications about updates or run silently
- **Smart Rollback**: Automatically rollback containers when updates fail or cause issues
- **Watchtower Replacement**: Drop-in replacement with enhanced functionality

### Update Options

Dockman provides flexible update handling with multiple deployment strategies:

#### Update Modes

* **Notify Only**: Receive alerts about available updates without automatic deployment
* **Auto-Update**: Automatically pull and deploy new container versions on a configurable schedule
* **Manual Update**: Update containers directly through the web UI

#### Rollback Protection

Dockman includes built-in safety mechanisms to protect against failed updates:

**Health Check Monitoring**

* Configure HTTP endpoint monitoring to verify container health after updates
* Set a custom endpoint that Dockman will ping X seconds after container startup
* Automatic rollback triggers if the health check fails

**Runtime Stability Checks**

* Define minimum runtime requirements for containers
* Example: Container must run continuously for 5 minutes post-update
* Automatic rollback to previous configuration if stability threshold isn't met
* Notifications sent for all rollback events

These safety features ensure your services remain stable and minimize downtime during updates.

### Disable updates

You can disable updates for specific containers by adding the label

```
dockman.update.disable=true
```

### Update Healthchecks

#### Container Uptime Check

The container stability check verifies that a running container has maintained the minimum required uptime after waiting
for a specified duration.

If the container crashes, restarts, or summons eldritch horrors, dockman rolls back to the old container.

Basically prevents the classic "it works on my machine... oh wait, it just died" scenario.

> [!CAUTION]
> Be careful when using longer times here as it will pause
> the update process until the uptime requirements are met,
> especially when running via the UI, you dont want to see a loading spinner for 1 hour

- **Success**: If the container meets the minimum uptime requirement, the check passes
- **Failure**: If the container fails to meet the uptime requirement, it triggers a rollback and sends a notification
- **Skip**: The check is automatically skipped if no label is set or if an invalid time format is provided

##### Configuration

Add the following label to your container to enable the stability check:

```yaml
dockman.update.healthcheck.uptime=<minimum-uptime>
```

##### Time Format

The `minimum-uptime` value uses Go's [time.ParseDuration](https://pkg.go.dev/time#ParseDuration) format, which accepts:

- **Units**: `ns`, `us` (or `µs`), `ms`, `s`, `m`, `h`
- **Format**: Decimal numbers with optional fractions and unit suffixes
- **Examples**: `300ms`, `1.5h`, `2h45m`, `30s`

##### Examples

```yaml
# Wait for 5 minutes of uptime
dockman.update.healthcheck.uptime=5m

  # Wait for 2 hours and 30 minutes
dockman.update.healthcheck.uptime=2h30m

  # Wait for 30 seconds
dockman.update.healthcheck.uptime=30s

  # Complex duration with milliseconds
dockman.update.healthcheck.uptime=1h10m500ms
```

##### Valid Duration Examples

| Duration String | Description                        |
|-----------------|------------------------------------|
| `30s`           | 30 seconds                         |
| `5m`            | 5 minutes                          |
| `1h`            | 1 hour                             |
| `2h30m`         | 2 hours and 30 minutes             |
| `1h10m10s`      | 1 hour, 10 minutes, and 10 seconds |
| `500ms`         | 500 milliseconds                   |
| `1.5h`          | 1.5 hours (90 minutes)             |

##### Notes

- Negative durations (e.g., `-1.5h`) are technically valid in Go's parser but should be avoided in this context
- The check will be skipped silently for invalid duration strings
- Both `us` and `µs` are accepted for microseconds

#### Container Ping Check

This health check pings a container after a specified amount of time or until it reaches healthy status

## Notifications

Configure dockman to send notifications on certain events

Events config

Available Providers

1. Email
2. Discord
3. Slack
4. Telegram
5. Http

## Multihost Support

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

If you spot a bug, have an idea for a feature, or just want to share your thoughts, please open
an [discussion](https://github.com/RA341/dockman/discussions) any and all
feedback is welcome.

I'd especially love to hear what you think about:

* The UI
    * I'm not a UI guy; in fact, I hate HTML/CSS in general. The current interface is mostly built using Material-UI
      and Gemini and designed for my preferences.
    * If you have ideas on how to make it look better or easier to use, I'm all ears. Feel free to open
      an [discussion](https://github.com/RA341/dockman/discussions) with
      your suggestions.

## Contributing

See [Contributing.md](CONTRIBUTING.md)

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE v3.0. See the [LICENSE](LICENSE) file for details.
