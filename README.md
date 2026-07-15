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

### Manual Deployment

If you prefer to deploy manually from your local machine, follow these steps:

1. **Create Cloudflare Resources:**
   Run these commands from the root and note the `id`s generated:
   ```bash
   npx wrangler kv:namespace create MENU_KV
   npx wrangler d1 create qr-menu-db
   npx wrangler r2 bucket create qr-menu-uploads
   ```

2. **Update Configuration:**
   Copy the generated `id`s and update the corresponding bindings in:
   - `apps/dashboard/wrangler.toml`
   - `apps/customer-menu/wrangler.toml`

3. **Apply Production Database Migrations:**
   Run the SQL scripts against your production D1 database:
   ```bash
   cd apps/dashboard
   for file in ../../packages/db/migrations/*.sql; do npx wrangler d1 execute DB --remote --file=$file; done
   ```

4. **Set Production Secrets:**
   For both `apps/dashboard` and `apps/customer-menu`, you need to securely set your production environment variables (like Auth0 keys). From inside each app directory, run:
   ```bash
   npx wrangler secret put AUTH0_DOMAIN
   npx wrangler secret put AUTH0_CLIENT_ID
   # ... repeat for all required variables listed in .env.dist
   ```

5. **Deploy All Apps:**
   Return to the root of the project and run the unified deploy command:
   ```bash
   make deploy
   ```

## Telemetry

This project uses Google Analytics to provide pageview tracking for the customer menus and dashboard. The generic tracking code (`G-S5L6XWQGWC`) is included to help track the usage of the open-source repository. If you are deploying this for your own production use, you should replace the `G-S5L6XWQGWC` tracking ID in `apps/dashboard-ui/index.html` and `apps/customer-menu/src/index.ts` with your own Google Analytics measurement ID.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [CC BY-NC 4.0 License](./LICENSE).
