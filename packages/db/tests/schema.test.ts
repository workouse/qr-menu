import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';

// Declare the env binding type for TypeScript
declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
  }
}

describe('D1 Schema Validation', () => {
  beforeAll(async () => {
    const migrations = import.meta.glob('../migrations/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const migrationFiles = Object.keys(migrations).sort();

    for (const file of migrationFiles) {
      const sqlContent = migrations[file];
      // Strip comments and split by semicolon
      const cleanSql = sqlContent.replace(/--.*/g, '');
      const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      
      for (const statement of statements) {
        await env.DB.prepare(statement).run();
      }
    }
  });
  it('should allow inserting an organization', async () => {
    const orgId = 'org_123';
    const result = await env.DB.prepare(
      `INSERT INTO organizations (id, name) VALUES (?, ?)`
    ).bind(orgId, 'Test Org').run();

    expect(result.success).toBe(true);

    const selectResult = await env.DB.prepare(
      `SELECT * FROM organizations WHERE id = ?`
    ).bind(orgId).first();

    expect(selectResult).toBeDefined();
    expect(selectResult?.name).toBe('Test Org');
  });

  it('should enforce foreign key on venues -> organizations', async () => {
    // Attempting to insert a venue with a non-existent org_id should fail
    const venueId = 'venue_123';
    
    await expect(async () => {
      await env.DB.prepare(
        `INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)`
      ).bind(venueId, 'invalid_org_id', 'Test Venue', 'test-venue').run();
    }).rejects.toThrow(); // FOREIGN KEY constraint failed
  });

  it('should allow full insertion flow for a menu with categories and items', async () => {
    const orgId = 'org_456';
    const venueId = 'venue_456';
    const menuId = 'menu_456';
    const catId = 'cat_456';
    const itemId = 'item_456';

    // 1. Insert Org
    await env.DB.prepare(`INSERT INTO organizations (id, name) VALUES (?, ?)`).bind(orgId, 'Org 2').run();
    // 2. Insert Venue
    await env.DB.prepare(`INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)`).bind(venueId, orgId, 'Venue 2', 'venue-2').run();
    // 3. Insert Menu
    await env.DB.prepare(`INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, ?)`).bind(menuId, venueId, 'Main Menu', 1).run();
    // 4. Insert Category
    await env.DB.prepare(`INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, ?)`).bind(catId, menuId, 'Starters', 1).run();
    // 5. Insert Item
    await env.DB.prepare(`INSERT INTO items (id, category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, ?, ?)`).bind(itemId, catId, 'Fries', 'Salty', 500, 1).run();

    // Verify Item
    const item = await env.DB.prepare(`SELECT * FROM items WHERE id = ?`).bind(itemId).first();
    expect(item?.name).toBe('Fries');
    expect(item?.price).toBe(500);
  });

  it('should allow inserting and verifying a subscription', async () => {
    const orgId = 'org_789';
    const subId = 'sub_789';
    await env.DB.prepare(`INSERT INTO organizations (id, name) VALUES (?, ?)`).bind(orgId, 'Org 3').run();
    
    await env.DB.prepare(`INSERT INTO subscriptions (id, org_id, tier, status) VALUES (?, ?, ?, ?)`).bind(subId, orgId, 'pro', 'active').run();

    const sub = await env.DB.prepare(`SELECT * FROM subscriptions WHERE id = ?`).bind(subId).first();
    expect(sub?.tier).toBe('pro');
    expect(sub?.status).toBe('active');
  });
});
