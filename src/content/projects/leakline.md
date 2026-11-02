---
title: Leakline
slug: leakline
description: "A local-first Rust and Tauri desktop project, building a filesystem scanning foundation for future configuration analysis."
technologies: [Rust, Tauri]
status: Active Development
category: Software / security
repository: https://github.com/CyberSteveon/leakline
featured: false
order: 4
visual: code
---
## Local-first exploration

Leakline is a desktop application being developed to identify system configuration and security issues. The long-term goal is lightweight analysis without relying on cloud services.

## Current implementation

The desktop application launches, while the graphical interface is still under development. A functional recursive filesystem traversal engine provides the foundation for future analysis features. The project uses a modular Rust scanning engine and Tauri application structure.

## Development approach

Parts of the engine were separated into a command-line prototype, Config Checker RS, to allow iteration on directory traversal and rule validation before desktop integration.

## Next steps

Expand the rule engine, add configuration validation and security analysis, and connect the scanning engine to the graphical interface. These are planned capabilities, not completed features.
