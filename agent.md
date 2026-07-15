# QR Menu - Context Memory (agent.md)

## System State
- **Status**: Prepared for Open Source release (Active Development).
- **Project Root**: `/home/delirehberi/www/qr-menu.workouse.com`
- **Monorepo Manager**: `pnpm` workspaces.
- **Backend**: Hono on Cloudflare Workers.
- **Database**: Cloudflare D1.
- **Static Storage**: Cloudflare KV.
- **Media**: Cloudflare R2.
- **Authentication**: Auth0.
- **Billing**: Lemon Squeezy.
- **UI**: Tailwind CSS everywhere, TailAdmin for Dashboard.
- **Telemetry**: Google Analytics.
- **License**: CC BY-NC 4.0 (Personal & Non-Commercial Use Only).

## Architectural Patterns
- **Multi-Tenant Monorepo**: Separated frontend (`dashboard-ui`), lightweight edge worker (`customer-menu`), API worker (`dashboard`), and shared packages (`db`, `auth`).
- **The Zero-Database Static Menu Pipeline**: 
  - Customer menus are rendered statically on-save and stored in Cloudflare KV.
  - The delivery worker strictly fetches from KV. NO runtime SQL queries during menu viewing.
- **RBAC**: Super Admin, Org Owner, Org Staff, Anonymous.

## Strict Development Principles
1. **Ultra-lightweight Client Bundles**: The `customer-menu` must remain minimal. Inline/embedded CSS and static HTML strings.
2. **Atomic Edge**: Edge delivery workers do zero heavy lifting—only routing and KV lookups.
3. **Database Migrations**: All D1 changes go through strict schema migrations using wrangler and local testing.
4. **Local Dev Automation:** `dotenv` (managing `.env` files) and a master `Makefile` for multi-package orchestration (`make dev`, `make build`, etc.).
5. **Security & Open Source Readiness**: 
   - Never hardcode secrets, API keys, or specific domains (like `qr-menu.workouse.com`) in the code.
   - Use `.env.dist` as the template for community users.
   - Local secrets must stay exclusively in `.env` and `.dev.vars` (which are gitignored).
6. **Automated Deployments**: Uses GitHub Actions (`.github/workflows/deploy.yml`) to deploy the Workers to Cloudflare upon pushing to `master`.

## State-Machine: Static Menu Compile Pipeline
1. **Trigger**: An Org Staff/Owner clicks "Save" on their menu via the Dashboard.
2. **Assemble**: The Hono Dashboard worker queries D1 for the full Menu tree (Categories, Items, Modifiers).
3. **Render**: The worker renders the HTML string with inline Tailwind CSS for the venue.
4. **Store**: The rendered HTML is pushed to Cloudflare KV with the key `html:venue::[venue_slug]`.
5. **Serve**: An Anonymous user requests the `customer-menu` worker. The worker reads `html:venue::[venue_slug]` from KV and instantly returns the `text/html` response.
