---
title: Infrastructure Automation Lab
slug: infrastructure-lab
description: "A local Ansible lab using Docker, Nginx, and Jinja2 to practice repeatable infrastructure configuration."
technologies: [Ansible, Docker, Nginx, Jinja2, Linux]
status: Active Development
category: Infrastructure / automation
featured: true
order: 2
visual: infrastructure
---
## Configuration as code

This personal lab explores managing an Ubuntu Docker container with Ansible. It provides a small, isolated environment for practicing configuration management.

## Implemented foundation

The playbook uses Ansible's package module to update the package cache and install Nginx. A template task renders a Jinja2 configuration using a server-name variable. The configuration defines an HTTP endpoint on port 8080 with a simple response.

The Docker connection plugin supports managing the local container without configuring an SSH service inside it.

## Current scope

This is a local learning lab under active development. The playbook and template provide a concrete starting point for further infrastructure automation practice. A public repository and deployment walkthrough are not yet linked here.
