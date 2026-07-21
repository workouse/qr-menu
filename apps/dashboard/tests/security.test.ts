import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';

// @ts-ignore
import sql1 from '../../../packages/db/migrations/0001_initial_schema.sql?raw';
// @ts-ignore
import sql2 from '../../../packages/db/migrations/0002_onboarding.sql?raw';
// @ts-ignore
import sql3 from '../../../packages/db/migrations/0003_org_currency.sql?raw';
// @ts-ignore
import sql4 from '../../../packages/db/migrations/0004_category_active.sql?raw';
// @ts-ignore
import sql5 from '../../../packages/db/migrations/0005_backfill_active_flags.sql?raw';
// @ts-ignore
import sql6 from '../../../packages/db/migrations/0006_multilanguage.sql?raw';
// @ts-ignore
import sql7 from '../../../packages/db/migrations/0007_theme_and_org_details.sql?raw';
// @ts-ignore
import sql8 from '../../../packages/db/migrations/0008_allergens_dietary.sql?raw';
// @ts-ignore
import sql9 from '../../../packages/db/migrations/0009_nutrition_info.sql?raw';
// @ts-ignore
import sql10 from '../../../packages/db/migrations/0010_seed_fixtures.sql?raw';
// @ts-ignore
import sql11 from '../../../packages/db/migrations/0011_venue_custom_domain.sql?raw';
// @ts-ignore
import sql12 from '../../../packages/db/migrations/0012_add_org_owner.sql?raw';
// @ts-ignore
import sql13 from '../../../packages/db/migrations/0013_advanced_theming.sql?raw';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    MENU_KV: KVNamespace;
  }
}

describe('Tenant Isolation and Roles', () => {
  beforeAll(async () => {
    // Setup D1 Schema
    const sqls = [sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11, sql12, sql13];
    for (const sql of sqls) {
      const cleanSql = sql.replace(/--.*/g, '');
      const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await env.DB.prepare(statement).run();
      }
    }

    // Setup Org A
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind('org_A', 'Organization A').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)').bind('test_owner_A', 'org_A', 'ownerA@test.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)').bind('test_staff_A', 'org_A', 'staffA@test.com', 'org_staff').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind('venue_A', 'org_A', 'Venue A', 'venue-a').run();
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('menu_A', 'venue_A', 'Menu A').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('cat_A', 'menu_A', 'Cat A').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('item_A', 'cat_A', 'Item A', 100).run();
    await env.DB.prepare('INSERT INTO subscriptions (id, org_id, tier, status) VALUES (?, ?, ?, ?)').bind('sub_A', 'org_A', 'Business', 'active').run();

    // Setup Org B
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind('org_B', 'Organization B').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)').bind('test_owner_B', 'org_B', 'ownerB@test.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)').bind('test_staff_B', 'org_B', 'staffB@test.com', 'org_staff').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind('venue_B', 'org_B', 'Venue B', 'venue-b').run();
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('menu_B', 'venue_B', 'Menu B').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('cat_B', 'menu_B', 'Cat B').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('item_B', 'cat_B', 'Item B', 100).run();
  });

  describe('Tenant Isolation (Cross-Org Access)', () => {
    it('Org A owner can access Org A venue', async () => {
      const res = await app.request('/api/venues/venue_A', {
        headers: { 'Authorization': 'Bearer test_owner_A' }
      }, env);
      expect(res.status).toBe(200);
    });

    it('Org A owner receives 403 when accessing Org B venue', async () => {
      const res = await app.request('/api/venues/venue_B', {
        headers: { 'Authorization': 'Bearer test_owner_A' }
      }, env);
      expect(res.status).toBe(403);
    });

    it('Org A owner receives 403 when patching Org B menu', async () => {
      const res = await app.request('/api/menus/menu_B', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer test_owner_A',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Hacked Menu' })
      }, env);
      expect(res.status).toBe(403);
    });

    it('Org A owner receives 403 when trying to fetch Org B category items', async () => {
      const res = await app.request('/api/categories/cat_B/items', {
        headers: { 'Authorization': 'Bearer test_owner_A' }
      }, env);
      expect(res.status).toBe(403);
    });
  });

  describe('Role Boundaries (org_owner vs org_staff)', () => {
    it('Org Staff can fetch and create menus', async () => {
      // Fetch menus
      let res = await app.request('/api/venues/venue_A/menus', {
        headers: { 'Authorization': 'Bearer test_staff_A' }
      }, env);
      expect(res.status).toBe(200);
      let data = await res.json() as any[];
      expect(data.length).toBe(1);

      // Create new menu
      res = await app.request('/api/venues/venue_A/menus', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_staff_A',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Staff Created Menu', is_active: true })
      }, env);
      expect(res.status).toBe(201);
    });

    it('Org Staff gets 403 when trying to patch a Venue', async () => {
      const res = await app.request('/api/venues/venue_A', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer test_staff_A',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Hacked Venue' })
      }, env);
      expect(res.status).toBe(403); // because PATCH venue requires 'org_owner'
    });

    it('Org Staff gets 403 when trying to edit Organization details', async () => {
      const res = await app.request('/api/organizations/org_A', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer test_staff_A',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Hacked Org' })
      }, env);
      expect(res.status).toBe(403);
    });
    
    it('Org Staff can manage translations (categories)', async () => {
      const res = await app.request('/api/categories/cat_A/translations/tr', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test_staff_A',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Kategori A' })
      }, env);
      expect(res.status).toBe(200);
    });
  });
});
