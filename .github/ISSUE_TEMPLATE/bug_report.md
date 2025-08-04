---
name: Bug report
about: Create a bug report
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Additional context**
Add any other context about the problem here.

**Tracing Info**

Add screenshot/text of Dockman (replace the placeholders)

* version/commit/build date etc
  ```
  ==========================================================================================
  Version        : 
  Flavour        : 
  BuildDate      : 
  ------------------------------------------------------------------------------------------
  Branch         : 
  CommitInfo     : 
  GoVersion      : 
  ------------------------------------------------------------------------------------------
  Repo           : 
  Branch         : 
  Commit         : 
  ==========================================================================================
  ```

* config table
  ```
  ╭────────────────────────────────────────────────────────── Config ──────────────────────────────────────────────────────────╮
  │                                                                                                                            │
  │  Port:               8866                 Port to run the server on                            Env: DOCKMAN_PORT           │
  │  AllowedOrigins:     *                    Allowed origins for the API (in CSV)                 Env: DOCKMAN_ORIGINS        │
  │  UIPath:             dist                 Path to frontend files                               Env: DOCKMAN_UI_PATH        │
  │  LocalAddr:          192.168.22.119       Local machine IP address                             Env: DOCKMAN_MACHINE_ADDR   │
  │  ComposeRoot:        /path/stack/compose  Root directory for compose files                     Env: DOCKMAN_COMPOSE_ROOT   │
  │  ConfigDir:          /config              Directory to store dockman config                    Env: DOCKMAN_CONFIG         │
  │  Auth.Enable:        true                 Enable authentication                                Env: DOCKMAN_AUTH_ENABLE    │
  │  Auth.Username:      r334                 authentication username                              Env: DOCKMAN_AUTH_USERNAME  │
  │  Auth.Password:      *REDACTED* ^_^       authentication password                              Env: DOCKMAN_AUTH_PASSWORD  │
  │  Auth.CookieExpiry:  6h                   Set cookie expiry-300ms/1.5h/2h45m [ns|us|ms|s|m|h]  Env: DOCKMAN_AUTH_EXPIRY    │
  │  Updater.Addr:       http://updater:8869  Host address for dockman updater                     Env: DOCKMAN_UPDATER_HOST   │
  │  Updater.PassKey:    someAuthkey          Authentication key for dockman updater               Env: DOCKMAN_UPDATER_KEY    │
  │  Log.Level:          debug                disabled|debug|info|warn|error|fatal                 Env: DOCKMAN_LOG_LEVEL      │
  │  Log.Verbose:        false                show more info in logs                               Env: DOCKMAN_LOG_VERBOSE    │
  │                                                                                                                            │
  │  To modify config, set the respective Env:                                                                                 │
  │                                                                                                                            │
  ╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
  ```
