You are an expert software architect and elite full-stack engineer specializing in the Cloudflare ecosystem, high-performance monorepos, and multi-tenant SaaS architectures. 

Your task is to initialize, structure, and document a high-performance, mobile-first, multi-tenant QR Menu SaaS application named "QR Menu".

### 1. HIGH-LEVEL ARCHITECTURE & TECH STACK
You must design and scaffold a monorepo adhering strictly to this stack:
- **Monorepo Manager:** `pnpm` workspaces.
- **Local Dev Automation:** `direnv` (managing `.envrc` files) and a master `Makefile` for multi-package orchestration (`make dev`, `make build`, etc.).
- **Backend & Routing Engine:** Hono running on Cloudflare Workers.
- **Database:** Cloudflare D1 (Relational SQL).
- **Static Asset / Cache Storage:** Cloudflare KV.
- **Media Storage:** Cloudflare R2 for compressed food item images.
- **Authentication & Auth0 RBAC:** Auth0 managing identities and metadata mapping.
- **Billing Engine:** Lemon Squeezy handling webhooks and subscription plans.
- **Styling & UI:** Tailwind CSS everywhere.
- **Management Dashboard UI:** Built using components and layouts from TailAdmin.

---

### 2. CORE WORKFLOWS & TENANCY DESIGNS
- **Multi-Venue Tenancy:** An Organization can own and operate multiple Venues (locations). 
- **The Zero-Database Static Menu Pipeline:** 
  - The customer-facing menu (`site.com/:venue_slug`) MUST be a 100% static, highly optimized HTML bundle styled natively with inline/embedded Tailwind CSS.
  - When an admin saves changes in the dashboard, a Hono Worker compile-pipeline must trigger: it fetches the menu layout from D1, renders the customer HTML layout, and pushes it directly into Cloudflare KV under the key `html:venue::[venue_slug]`.
  - When a customer visits, a lightweight Hono edge router instantly fetches this static string out of Cloudflare KV. There is zero runtime database overhead during user browsing.
- **Role-Based Access Control (RBAC):**
  - `Super Admin`: Absolute access across all organizations, usage stats, and feature toggles.
  - `Org Owner`: Managing organization settings, billing (Lemon Squeezy integration), deleting/adding venues, and staff permissions.
  - `Org Staff`: Modifying menus, toggling item availability, updating pricing, but restricted from billing and venue deletion.
  - `Anonymous User`: Frictionless mobile browsing of the static menu with zero auth required.

---

### 3. OUTPUT DELIVERABLES REQUIRED
Before generating code, you must construct three operational blueprints inside the project root:

#### Deliverable A: `agent.md`
Create a persistent context memory file for yourself (`agent.md`) that outlines:
- System state, active architectural patterns, and exact monorepo directory mapping.
- Strict development principles (e.g., maintaining ultra-lightweight client bundles, keeping the edge atomic, schema migrations workflow for D1).
- An explanation of the state-machine powering the static menu compile pipeline.

#### Deliverable B: Project Outlines
Document the file and directory structural layout for the `pnpm` workspaces. This must include:
- `apps/dashboard`: The TailAdmin panel managed by Hono + Auth0 authentication.
- `apps/customer-menu`: The lightweight edge-delivery worker querying KV for static pages.
- `packages/db`: D1 relational schemas (Organizations, Users, Venues, Menus, Categories, Items, Subscriptions), seeds, and migration commands.
- `packages/auth`: Reusable Auth0 middleware logic and RBAC token verifiers.
- Root configuration configurations (`pnpm-workspace.yaml`, master `Makefile`, root `.envrc` guidelines).

#### Deliverable C: Phase-by-Phase Task List
Generate an interactive, prioritized markdown checkbox checklist (`- [ ]`) itemizing step-by-step implementation. Divide this into distinct execution chunks:
1. **Phase 1: Foundations:** Monorepo setup, `pnpm` workspace config, `Makefile`, `direnv`, and D1 schema configurations.
2. **Phase 2: Authentication & Multi-Tenancy:** Auth0 integration, Hono middlewares for RBAC, and Organization-to-Venue routing logic.
3. **Phase 3: The Static Compile Pipeline:** Core D1-to-KV menu compilation logic, layout building with Tailwind, and image compression pipelines via R2.
4. **Phase 4: TailAdmin Dashboard Implementation:** Building management screens for Owners and Staff to configure menus dynamically on mobile screens.
5. **Phase 5: Monetization:** Lemon Squeezy webhook ingestion worker and restriction triggers based on active tier status.
6. **Phase 6: Customer UX & Polish:** Allergen/dietary filtering mechanics in the static template and high-resolution QR batch generation engines (SVG/PDF).

Begin by generating these documentation primitives (`agent.md`, the structural Project Outlines, and the step-by-step Task List) sequentially. Do not write feature code until this foundational plan is written and confirmed.
