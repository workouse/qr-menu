# QR Menu (Non-Commercial Edition)

A high-performance, edge-first digital QR menu system built for restaurants. Built using Cloudflare Workers, Hono, React, and Auth0.

> [!WARNING]
> **License Restriction**
> This repository is licensed under the **CC BY-NC 4.0** license. It is available for **personal or non-commercial use only**. You may not use this software to generate revenue, run a commercial SaaS, or sell services.

## Features

- **Zero Database Lag**: Menus are compiled directly to HTML and served globally from Cloudflare's Edge (KV/R2).
- **Multi-Tenant Dashboard**: Manage multiple organizations, venues, and menus from a single dashboard.
- **Role-Based Access Control**: Built-in support for Superadmin, Organization Owners, and Staff via Auth0.
- **Dynamic Theming**: Easily customize fonts, colors, and layout styles for each menu.
- **Multi-language Support**: Automatically serves menus based on the user's browser language.

## Architecture

This is a monorepo managed with `pnpm`.

- `apps/customer-menu`: The high-speed Edge Worker serving the customer-facing menus (compiled HTML).
- `apps/dashboard`: The Edge Worker API powering the restaurant management dashboard.
- `apps/dashboard-ui`: The React Frontend for the management dashboard.
- `packages/auth`: Shared authentication middleware.
- `packages/db`: Shared D1 Database schemas and logic.

## Prerequisites

- Node.js (v20+ recommended, use `nvm use` to read the `.nvmrc`)
- `pnpm` (v8+)
- A Cloudflare Account (Workers, D1, KV, R2)
- An Auth0 Account (for Authentication and RBAC)

## Local Development

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment Variables:**
   Copy the template to set up your environment variables:
   ```bash
   cp .env.dist .env
   # Make sure to also set up .dev.vars in apps/dashboard/
   ```
   You will need to configure your Auth0 Tenant and Roles. Please refer to `roles-permissions.md` for detailed instructions on configuring Auth0.

3. **Start the Development Server:**
   Run the following from the root directory to start all applications simultaneously:
   ```bash
   pnpm dev
   ```

## Deployment

Deployments are automated via GitHub Actions.

1. Fork this repository.
2. In your GitHub repository settings, go to **Secrets and variables > Actions**.
3. Add a new repository secret named `CLOUDFLARE_API_TOKEN` with your Cloudflare API Token (must have permissions to edit Workers).
4. Push to the `master` branch. The included GitHub Action (`.github/workflows/deploy.yml`) will automatically build and deploy both the `dashboard` and `customer-menu` Workers to your Cloudflare account.
5. (Optional) Deploy the `dashboard-ui` to Cloudflare Pages.

## Telemetry

This project optionally supports Cloudflare Web Analytics to provide privacy-first analytics for menu views. To enable this, simply set the `VITE_CF_ANALYTICS_TOKEN` environment variable during the build process, and the necessary tracking snippet will be automatically injected.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [CC BY-NC 4.0 License](./LICENSE).
