---
title: Architecture Overview
description: High-level overview of the monorepo architecture
---

The QR Menu project is built as a monorepo using `pnpm` workspaces. This allows us to share code between our frontend applications, backend services, and documentation.

## Project Structure

- `apps/`: Contains the deployable applications.
  - `dashboard-ui/`: The React-based dashboard for restaurant owners.
  - `customer-menu/`: The public-facing menu application that customers see when they scan a QR code.
  - `docs/`: This Astro Starlight documentation site.
- `packages/`: Contains shared libraries and utilities.
  - `database/`: Shared database schema and client code.
  - `ui/`: Shared UI components.

## Tech Stack
- **Frontend**: React, Astro, TailwindCSS
- **Backend / Deployment**: Cloudflare Workers, Cloudflare Pages
- **Package Manager**: pnpm
