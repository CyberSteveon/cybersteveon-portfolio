---
title: Leakline
slug: leakline
description: "A working desktop scanner prototype built with Rust, Tauri, and React to investigate exposed secrets and configuration risks in local files."
technologies: [Rust, Tauri, React, JavaScript]
status: Active Development
category: Software / security
repository: https://github.com/CyberSteveon/leakline
featured: true
order: 1
visual: code
image:
  src: /images/projects/leakline.png
  alt: Leakline desktop interface showing scanner dependencies, scan controls, and two medium-severity findings.
---
## A working desktop prototype

Leakline brings local file scanning into a desktop application. The core scanning workflow is functional; the interface and tool still need refinement.

## How it fits together

The React interface connects to a Rust backend through Tauri commands. Users can select a directory, start or cancel a scan, follow progress, and review findings. The backend separates target validation, file discovery, native rules, scan management, and adapters for Gitleaks and Semgrep.

The native scanner provides pattern matching within the application. Gitleaks and Semgrep integrations use external tools; they are separate from the native engine.

## Building with agents

I developed the working model using Antigravity’s agentic software development workflow. Exploring that style of development was an enjoyable part of the project, and it gave me hands-on exposure to a Rust, Tauri, and React application.

## Current focus

- Improve the GUI and make results easier to navigate.
- Refine the scanning behavior and overall workflow.
- Continue testing and evaluating the tool as it develops.

The project is a working prototype in active development, with more work ahead before a polished release.
