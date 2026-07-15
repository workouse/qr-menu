# QR Menu Task List

All phases follow a Test-Driven Development (TDD) workflow. We write tests before implementation. Every phase must conclude with a working, testable milestone proving the system works end-to-end for that slice.

## Phase 1: Multi-Tenancy, Roles & Security Fixes
- [x] TDD: Write unit/integration tests asserting that Organization A users cannot CRUD venues/menus/categories/items/languages belonging to Organization B.
- [x] TDD: Write tests asserting that `org_staff` users can CRUD menus/categories/items/languages, but cannot delete venues, modify organization details, or manage billing settings.
- [x] Modify `packages/auth` `requireRole` middleware to support checking an array of allowed roles.
- [x] Modify `apps/dashboard` endpoints to restrict data queries (`GET /api/venues`) and mutations strictly by the user's `org_id` (ownership validation).
- [x] Modify `apps/dashboard` endpoint permissions to grant `org_staff` access to menus, categories, items, and translations CRUD operations.

## Phase 2: Test Suite Correctness & Automation Fixes
- [x] Add `"test": "vitest run"` script to `apps/dashboard-ui/package.json`.
- [x] Update root `Makefile` or root scripts to verify that UI tests run and pass when running `make test`.
- [x] Modify `packages/db/tests/schema.test.ts` to dynamically execute all migration files (`0001` through `0007`) in `packages/db/migrations` during test setup, ensuring full schema compatibility is tested.

## Phase 3: Image Upload Compression
- [x] Create a browser-side WebP compression utility and integrate it into the UI upload components.
- [x] Update `apps/dashboard`'s `POST /api/uploads` endpoint to enforce the `image/webp` type.

## Phase 4: Billing & Monetization (Lemon Squeezy)
- [x] TDD: Write integration tests asserting Lemon Squeezy webhook events (created, updated, canceled) correctly update the subscription status in D1.
- [x] Implement Lemon Squeezy webhook ingestion route/worker inside `apps/dashboard`.
- [x] TDD: Write tests asserting that resource creation (venues, menus, categories, items) is rejected (e.g. 403 Forbidden) if active subscription tier limits are exceeded.
- [x] Hook up active subscription tier checks to resource creation routes in the backend.
- [x] Add billing details and plan upgrade/downgrade section to the Settings page in `apps/dashboard-ui`.

## Phase 5: Allergen & Dietary Filtering
- [x] Create D1 migration to add dietary/allergen columns (e.g. `is_vegan`, `is_gluten_free`, `allergens` text) to the `items` table.
- [x] TDD: Write tests for allergen/dietary configuration in the Menu Builder API and UI.
- [x] Add input selectors for dietary/allergen tags to the Menu Builder form in the frontend.
- [x] TDD: Write tests asserting that allergen/dietary tags are correctly compiled into the static customer menu HTML string.
- [x] Update the static compiler pipeline to embed allergen/dietary metadata in the HTML structure.
- [x] Implement client-side search and allergen/dietary filters in the compiled static customer menu template.
