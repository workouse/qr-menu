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

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
  }
}

describe('Dashboard API Integration', () => {
  beforeAll(async () => {
    // Setup D1 Schema with all migrations
    const sqls = [sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11];
    for (const sql of sqls) {
      const cleanSql = sql.replace(/--.*/g, '');
      const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await env.DB.prepare(statement).run();
      }
    }
  });

  it('should reject unauthorized organization creation', async () => {
    const res = await app.request('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Test Org' })
    }, env);
    
    expect(res.status).toBe(401);
  });

  it('should create an organization as superadmin', async () => {
    const res = await app.request('/api/organizations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_superadmin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Test Org' })
    }, env);
    
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Org');
  });

  it('should create a venue as org_owner', async () => {
    const orgId = 'org_test_123';
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'My Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    // Upgrade subscription to standard so we can create more than 1 venue for uniqueness testing
    await env.DB.prepare('INSERT INTO subscriptions (id, org_id, tier, status) VALUES (?, ?, ?, ?)').bind('sub_test_123', orgId, 'Standard', 'active').run();

    const res = await app.request(`/api/organizations/${orgId}/venues`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_owner',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'My Venue' })
    }, env);
    
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.name).toBe('My Venue');
    expect(data.slug).toBe('my-venue');
    expect(data.domain_verification_token).toBeDefined();

    // Check uniqueness generation
    const resDuplicate = await app.request(`/api/organizations/${orgId}/venues`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_owner',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'My Venue' })
    }, env);
    expect(resDuplicate.status).toBe(201);
    const dataDuplicate = await resDuplicate.json() as any;
    expect(dataDuplicate.slug).toBe('my-venue-1');
  });

  it('should allow full creation of menu, category, and items', async () => {
    // Setup org and venue
    const orgId = 'org_api_123';
    const venueId = 'venue_api_123';
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'My Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'My Venue', 'slug-1').run();

    // 1. Create Menu
    let res = await app.request(`/api/venues/${venueId}/menus`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dinner Menu', is_active: true })
    }, env);
    expect(res.status).toBe(201);
    const menuData = await res.json() as any;
    const menuId = menuData.id;

    // 2. Fetch Menus
    res = await app.request(`/api/venues/${venueId}/menus`, {
      headers: { 'Authorization': 'Bearer test_owner' }
    }, env);
    expect(res.status).toBe(200);
    const menus = await res.json() as any[];
    expect(menus.length).toBe(1);
    expect(menus[0].name).toBe('Dinner Menu');

    // 3. Create Category
    res = await app.request(`/api/menus/${menuId}/categories`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mains', sort_order: 1 })
    }, env);
    expect(res.status).toBe(201);
    const catData = await res.json() as any;
    const catId = catData.id;

    // 4. Create Item
    res = await app.request(`/api/categories/${catId}/items`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Steak', price: 2500 })
    }, env);
    expect(res.status).toBe(201);
    const itemData = await res.json() as any;
    expect(itemData.name).toBe('Steak');
  });

  it('should get and update venue custom themes and branding details', async () => {
    const orgId = 'org_theme_123';
    const venueId = 'venue_theme_123';
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Theme Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'Theme Venue', 'theme-venue-slug').run();

    // Get venue
    let res = await app.request(`/api/venues/${venueId}`, {
      headers: { 'Authorization': 'Bearer test_owner' }
    }, env);
    expect(res.status).toBe(200);
    let data = await res.json() as any;
    expect(data.theme_id).toBe('classic-indigo');
    expect(data.primary_color).toBe('#4f46e5');

    // Update venue customization
    res = await app.request(`/api/venues/${venueId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer test_owner',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logo_url: '/uploads/my-logo.png',
        website: 'https://venue-website.com',
        primary_color: '#ff0000',
        accent_color: '#00ff00',
        background_color: '#0000ff',
        theme_font: 'serif',
        layout_style: 'cards'
      })
    }, env);
    expect(res.status).toBe(200);
    data = await res.json() as any;
    expect(data.logo_url).toBe('/uploads/my-logo.png');
    expect(data.website).toBe('https://venue-website.com');
    expect(data.primary_color).toBe('#ff0000');
    expect(data.accent_color).toBe('#00ff00');
    expect(data.background_color).toBe('#0000ff');
    expect(data.theme_font).toBe('serif');
    expect(data.layout_style).toBe('cards');
  });

  it('should create and update items with dietary and allergen tags', async () => {
    // Setup org and venue
    const orgId = 'org_diet_123';
    const venueId = 'venue_diet_123';
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Diet Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'Diet Venue', 'diet-venue').run();

    // 1. Create Menu & Category
    let res = await app.request(`/api/venues/${venueId}/menus`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Diet Menu' })
    }, env);
    const menuData = await res.json() as any;

    res = await app.request(`/api/menus/${menuData.id}/categories`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vegan Options', sort_order: 1 })
    }, env);
    const catData = await res.json() as any;

    // 2. Create Item with dietary tags
    res = await app.request(`/api/categories/${catData.id}/items`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vegan Salad',
        price: 1500,
        is_vegan: 1,
        is_gluten_free: 1,
        allergens: 'nuts, soy'
      })
    }, env);
    expect(res.status).toBe(201);
    let itemData = await res.json() as any;
    expect(itemData.name).toBe('Vegan Salad');
    expect(itemData.is_vegan).toBe(1);
    expect(itemData.is_gluten_free).toBe(1);
    expect(JSON.parse(itemData.allergens)).toEqual(['nuts', 'soy']);

    const itemId = itemData.id;

    // 3. Update Item dietary tags
    res = await app.request(`/api/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer test_owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vegan Salad Deluxe',
        price: 1800,
        is_vegan: 1,
        is_gluten_free: 0,
        allergens: 'nuts, soy, wheat'
      })
    }, env);
    expect(res.status).toBe(200);
    
    // 4. Verify Fetch
    res = await app.request(`/api/categories/${catData.id}/items`, {
      headers: { 'Authorization': 'Bearer test_owner' }
    }, env);
    const fetchedItems = await res.json() as any[];
    const fetchedItem = fetchedItems[0];
    
    expect(fetchedItem.name).toBe('Vegan Salad Deluxe');
    expect(fetchedItem.is_vegan).toBe(1);
    expect(fetchedItem.is_gluten_free).toBe(0);
    expect(JSON.parse(fetchedItem.allergens)).toEqual(['nuts', 'soy', 'wheat']);
  });

  it('should compile the customer menu and include dietary/allergen tags in HTML', async () => {
    // We will use the venue created in the previous test by inserting it or we can just create a new one to be safe.
    // Actually, let's just insert a new one to be completely isolated.
    const orgId = 'org_compile_123';
    const venueId = 'venue_compile_123';
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind(orgId, 'Compile Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET org_id=excluded.org_id').bind('test_owner', orgId, 'test@auth.com', 'org_owner').run();
    await env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)').bind(venueId, orgId, 'Compile Venue', 'compile-venue').run();
    
    // Add a menu, category, and item with dietary tags
    const menuId = 'menu_compile_1';
    await env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, 1)').bind(menuId, venueId, 'Main Menu').run();
    const catId = 'cat_compile_1';
    await env.DB.prepare('INSERT INTO categories (id, menu_id, name, sort_order) VALUES (?, ?, ?, 1)').bind(catId, menuId, 'Salads').run();
    await env.DB.prepare('INSERT INTO items (id, category_id, name, description, price, is_available, is_vegan, is_gluten_free, allergens) VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?)')
      .bind('item_compile_1', catId, 'Compile Salad', 'A very nice salad', 1500, JSON.stringify(['nuts'])).run();

    // Compile the venue
    const compileRes = await app.request(`/api/venues/${venueId}/compile`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test_owner' }
    }, env);
    expect(compileRes.status).toBe(200);

    // Fetch the compiled HTML from KV
    const html = await env.MENU_KV.get(`html:venue::compile-venue`);
    expect(html).not.toBeNull();
    
    // Check for dietary tags
    expect(html).toContain('data-is-vegan="true"');
    expect(html).toContain('data-en="Vegan"');
    expect(html).toContain('Allergens:');
    expect(html).toContain('nuts');
  });
});
