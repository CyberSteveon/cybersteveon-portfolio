---
title: Personal Finance API
slug: finance-api
description: "An early Python backend foundation with FastAPI, environment-driven settings, and an Apple Keychain credential provider."
technologies: [Python, FastAPI, Pydantic, Apple Keychain]
status: Active Development
category: Backend / software
featured: false
order: 6
visual: finance
---
## Starting with the backend

This project is the local foundation for a self-hosted personal finance application. The current work establishes the API and configuration structure before building the financial data features and dashboard.

## Implemented pieces

- A FastAPI application with an asynchronous health endpoint.
- CORS configuration for a local frontend origin.
- Environment-driven settings using Pydantic Settings.
- A credential-provider interface and an Apple Keychain implementation.
- A provider factory that selects the configured credential implementation.

## Credential boundary

The Apple implementation retrieves a named credential through the macOS Keychain command-line tool. Keeping that lookup behind an interface gives application code a consistent way to request credentials and leaves room for additional providers later.

## Current status

The project is in its local-foundation phase. The health endpoint and supporting configuration code are implemented; a finished dashboard and working financial data integrations are not part of this milestone. A public repository is not yet linked.
