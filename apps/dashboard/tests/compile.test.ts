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

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    MENU_KV: KVNamespace;
  }
}

describe('Menu Compilation', () => {
  beforeAll(async () => {
    // Setup D1 Schema with all migrations
    const sqls = [sql1, sql2, sql3, sql4, sql5, sql6, sql7];
    for (const sql of sqls) {
      const cleanSql = sql.replace(/--.*/g, '');
      const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await env.DB.prepare(statement).run();
      }
    }
  });

  it('should compile menu and push to KV', async () => {
    // 1. Seed the DB with venue data
    const orgId = 'org_comp_123';
    const venueId = 'venue_comp_123';
    const slug = 'test-cafe';
    
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Test Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'Test Cafe', slug).run();
    
    // Seed Menu, Category, Item
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('menu_1', venueId, 'Breakfast Menu').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('cat_1', 'menu_1', 'Hot Drinks').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('item_1', 'cat_1', 'Cappuccino', 450).run();

    // 2. Trigger compilation route
    const res = await app.request(`/api/venues/${venueId}/compile`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_owner'
      }
    }, env);
    
    expect(res.status).toBe(200);

    // 3. Assert HTML exists in KV
    const kvHtml = await env.MENU_KV.get(`html:venue::${slug}`);
    expect(kvHtml).not.toBeNull();
    expect(kvHtml).toContain('<html');
    expect(kvHtml).toContain('Test Cafe'); // Venue name
    expect(kvHtml).toContain('Breakfast Menu'); // Menu name
    expect(kvHtml).toContain('Hot Drinks'); // Category name
    expect(kvHtml).toContain('Cappuccino'); // Item name
    expect(kvHtml).toContain('$4.50'); // Price formatting
  });

  it('should compile multiple active menus and push to KV', async () => {
    // 1. Seed the DB with venue data for multi-menu test
    const orgId = 'org_comp_multi';
    const venueId = 'venue_comp_multi';
    const slug = 'multi-cafe';
    
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Multi Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'Multi Cafe', slug).run();
    
    // Seed Menu 1: Breakfast Menu
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('m_breakfast', venueId, 'Breakfast Menu').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('c_drinks', 'm_breakfast', 'Hot Drinks').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('i_cappuccino', 'c_drinks', 'Cappuccino', 450).run();

    // Seed Menu 2: Dinner Menu
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('m_dinner', venueId, 'Dinner Menu').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('c_mains', 'm_dinner', 'Mains').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('i_steak', 'c_mains', 'Ribeye Steak', 2500).run();

    // 2. Trigger compilation route
    const res = await app.request(`/api/venues/${venueId}/compile`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_owner'
      }
    }, env);
    
    expect(res.status).toBe(200);

    // 3. Assert HTML exists in KV and contains items from both menus, and also menu names as headers
    const kvHtml = await env.MENU_KV.get(`html:venue::${slug}`);
    expect(kvHtml).not.toBeNull();
    expect(kvHtml).toContain('<html');
    expect(kvHtml).toContain('Multi Cafe'); // Venue name
    
    // Check Menu Headers since menus.length > 1
    expect(kvHtml).toContain('Breakfast Menu'); 
    expect(kvHtml).toContain('Dinner Menu'); 
    
    // Check Category and Item Names
    expect(kvHtml).toContain('Hot Drinks'); 
    expect(kvHtml).toContain('Cappuccino');
    expect(kvHtml).toContain('$4.50');

    expect(kvHtml).toContain('Mains');
    expect(kvHtml).toContain('Ribeye Steak');
    expect(kvHtml).toContain('$25.00');
  });

  it('should compile menu with custom venue-level theme, logo, and footer contact details', async () => {
    const orgId = 'org_comp_custom';
    const venueId = 'venue_comp_custom';
    const slug = 'custom-cafe';

    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Custom Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare(`
      INSERT INTO venues (
        id, org_id, name, slug, 
        logo_url, website, phone, email, address,
        primary_color, accent_color, background_color, theme_font, layout_style
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      venueId, orgId, 'Custom Cafe', slug,
      '/uploads/logo.png', 'https://custom-website.com', '+123456', 'cafe@custom.com', '123 Custom St',
      '#ff0000', '#00ff00', '#0000ff', 'serif', 'cards'
    ).run();

    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind('m_custom', venueId, 'Main Menu').run();
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 0)').bind('c_custom', 'm_custom', 'Starters').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, price, is_available) VALUES (?, ?, ?, ?, 1)').bind('i_custom', 'c_custom', 'Garlic Bread', 650).run();

    const res = await app.request(`/api/venues/${venueId}/compile`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner' }
    }, env);
    expect(res.status).toBe(200);

    const kvHtml = await env.MENU_KV.get(`html:venue::${slug}`);
    expect(kvHtml).not.toBeNull();
    expect(kvHtml).toContain('Custom Cafe');
    
    // Check custom styling configurations are present in compiled HTML
    expect(kvHtml).toContain('/uploads/logo.png');
    expect(kvHtml).toContain('https://custom-website.com');
    expect(kvHtml).toContain('tel:+123456');
    expect(kvHtml).toContain('mailto:cafe@custom.com');
    expect(kvHtml).toContain('123 Custom St');
    
    // Check colors
    expect(kvHtml).toContain("--primary: #ff0000");
    expect(kvHtml).toContain("--accent: #00ff00");
    expect(kvHtml).toContain("--background: #0000ff");

    // Check JSON-LD Structured Schema
    expect(kvHtml).toContain('application/ld+json');
    expect(kvHtml).toContain('"@type": "Restaurant"');
    expect(kvHtml).toContain('"name": "Custom Cafe"');
    expect(kvHtml).toContain('"hasMenu"');
    
    // Check custom font link and style
    expect(kvHtml).toContain('Playfair+Display');
    expect(kvHtml).toContain("font-family: 'Playfair Display'");
    
    // Check cards layout structure
    expect(kvHtml).toContain('grid grid-cols-1 sm:grid-cols-2');
  });
});
