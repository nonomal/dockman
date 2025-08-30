---
sidebar_position: 0
title: Dockman
---

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

## Getting Help

Need assistance? Open a [discussion on GitHub](https://github.com/RA341/dockman/discussions).
