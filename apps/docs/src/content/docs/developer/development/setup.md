---
title: Local Setup
description: How to run the QR Menu project locally
---

This guide covers how to set up the QR Menu project on your local machine for development.

## Prerequisites
- Node.js (v26.2.0 recommended - use `nvm`)
- `pnpm` package manager
- A Cloudflare account (for Wrangler)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qr-menu
   ```

2. **Use the correct Node version**
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

## Running the Project

You can start the development server for the entire monorepo or specific apps.

To run the dashboard UI:
```bash
pnpm --filter dashboard-ui dev
```

To run the documentation site (this site!):
```bash
pnpm --filter docs dev
```
