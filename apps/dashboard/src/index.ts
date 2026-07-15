import { Hono } from 'hono';
import { requireAuth, requireRole, Auth0ManagementClient, type UserPayload } from '@qr-menu/auth';
import { createMiddleware } from 'hono/factory';
import { cors } from 'hono/cors';
import { MENU_CSS } from './menu.css';

type Bindings = {
  DB: D1Database;
  MENU_KV: KVNamespace;
  UPLOADS_BUCKET: R2Bucket;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  AUTH0_M2M_CLIENT_ID: string;
  AUTH0_M2M_CLIENT_SECRET: string;
  AUTH0_ORG_OWNER_ROLE_ID: string;
  AUTH0_ORG_STAFF_ROLE_ID: string;
  AUTH0_SUPERADMIN_ROLE_ID: string;
};

type Variables = {
  user: UserPayload & { org_id?: string | null };
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape user-supplied strings before embedding in compiled HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function verifyOwnership(c: any, type: 'org' | 'venue' | 'menu' | 'category' | 'item', id: string): Promise<boolean> {
  const user = c.get('user') as UserPayload & { org_id?: string | null };
  if (user.roles.includes('superadmin')) return true;
  if (!user.org_id) return false;

  if (type === 'org') {
    return id === user.org_id;
  } else if (type === 'venue') {
    const row = await c.env.DB.prepare('SELECT org_id FROM venues WHERE id = ?').bind(id).first() as any;
    return row?.org_id === user.org_id;
  } else if (type === 'menu') {
    const row = await c.env.DB.prepare('SELECT v.org_id FROM menus m JOIN venues v ON m.venue_id = v.id WHERE m.id = ?').bind(id).first() as any;
    return row?.org_id === user.org_id;
  } else if (type === 'category') {
    const row = await c.env.DB.prepare('SELECT v.org_id FROM categories c JOIN menus m ON c.menu_id = m.id JOIN venues v ON m.venue_id = v.id WHERE c.id = ?').bind(id).first() as any;
    return row?.org_id === user.org_id;
  } else if (type === 'item') {
    const row = await c.env.DB.prepare('SELECT v.org_id FROM items i JOIN categories c ON i.category_id = c.id JOIN menus m ON c.menu_id = m.id JOIN venues v ON m.venue_id = v.id WHERE i.id = ?').bind(id).first() as any;
    return row?.org_id === user.org_id;
  }
  return false;
}


/**
 * Build one language block for the compiled customer menu.
 * Falls back to English (base) content when a translation is missing.
 */
function buildLangBlock(
  langCode: string,
  isDefault: boolean,
  currencySymbol: string,
  menus: any[],
  categoriesByMenu: Map<string, any[]>,
  itemsByCategory: Map<string, any[]>,
  catTranslations: Map<string, Map<string, { name: string }>>,
  itemTranslations: Map<string, Map<string, { name: string; description: string | null }>>,
  layoutStyle: string
): string {
  let html = `<div class="lang-block">`;

  let totalCategories = 0;
  const allCategories: any[] = [];
  for (const menu of menus) {
    const cats = categoriesByMenu.get(menu.id) ?? [];
    totalCategories += cats.length;
    allCategories.push(...cats);
  }

  if (totalCategories === 0) {
    html += `<p class="text-center text-gray-500 italic py-8">No active menu available right now.</p>`;
    html += `</div>`;
    return html;
  }

  // Search & Filter Bar
  html += `
    <div class="mb-4 space-y-3 px-1">
      <div class="relative">
        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" placeholder="Search..." class="search-input w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm" />
      </div>
      <div class="flex gap-2">
        <button class="filter-vegan-btn px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors" data-en="Vegan" data-tr="Vegan">Vegan</button>
        <button class="filter-gf-btn px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors" data-en="Gluten-Free" data-tr="Glutensiz">Gluten-Free</button>
      </div>
    </div>
  `;

  // Sticky Category Navigation Bar
  html += `<div class="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-gray-200/50 -mx-4 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth mb-6">`;
  for (const cat of allCategories) {
    const catTr = catTranslations.get(cat.id)?.get(langCode);
    const catName = escapeHtml(catTr?.name ?? cat.name ?? '');
    html += `<a href="#cat-${cat.id}" class="whitespace-nowrap px-4 py-2 text-sm font-bold rounded-full border border-gray-200 bg-white text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-300">${catName}</a>`;
  }
  html += `</div>`;

  for (const menu of menus) {
    const categories = categoriesByMenu.get(menu.id) ?? [];
    if (categories.length === 0) continue;

    if (menus.length > 1) {
      html += `<div class="mt-8 mb-6 first:mt-2">`;
      html += `<h2 class="text-2xl font-black text-accent border-b-2 border-accent/10 pb-2">${escapeHtml(menu.name ?? '')}</h2>`;
      html += `</div>`;
    }

    for (const cat of categories) {
      const catTr = catTranslations.get(cat.id)?.get(langCode);
      const catName = escapeHtml(catTr?.name ?? cat.name ?? '');
      const coverImg = cat.cover_image_url
        ? `<img src="${escapeHtml(cat.cover_image_url)}" alt="${catName}" class="w-full h-40 object-cover" />`
        : '';

      html += `<div id="cat-${cat.id}" class="mb-10 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 scroll-mt-20">`;
      html += coverImg;
      html += `<div class="px-6 py-5">`;
      html += `<h3 class="text-xl font-bold border-b pb-2 mb-4 text-gray-800">${catName}</h3>`;

      const items = itemsByCategory.get(cat.id) ?? [];

      if (items.length === 0) {
        html += `<p class="text-sm text-gray-400 italic">No items available in this category.</p>`;
      } else {
        if (layoutStyle === 'cards') {
          html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">`;
          for (const item of items) {
            const itemTr = itemTranslations.get(item.id)?.get(langCode);
            const itemName = escapeHtml(itemTr?.name ?? item.name ?? '');
            const itemDesc = itemTr?.description ?? item.description ?? '';
            const itemPrice = `${currencySymbol}${(Number(item.price) / 100).toFixed(2)}`;
            const itemImg = item.image_url
              ? `<div class="w-full h-48 overflow-hidden bg-gray-50"><img src="${escapeHtml(item.image_url)}" alt="${itemName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>`
              : '';

            let tagsHtml = '';
            if (item.is_vegan === 1) tagsHtml += `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full" data-en="Vegan" data-tr="Vegan">Vegan</span> `;
            if (item.is_gluten_free === 1) tagsHtml += `<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full" data-en="Gluten-Free" data-tr="Glutensiz">Gluten-Free</span> `;
            
            let allergensHtml = '';
            if (item.allergens) {
              try {
                const arr = JSON.parse(item.allergens);
                if (arr.length > 0) {
                  allergensHtml = `<p class="text-[10px] text-gray-400 mt-1.5"><span class="font-semibold" data-en="Allergens:" data-tr="Alerjenler:">Allergens:</span> ${escapeHtml(arr.join(', '))}</p>`;
                }
              } catch (e) {}
            }

            html += `
              <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col item-card" data-is-vegan="${item.is_vegan === 1}" data-is-gluten-free="${item.is_gluten_free === 1}">
                ${itemImg}
                <div class="p-5 flex-1 flex flex-col justify-between">
                  <div class="space-y-2">
                    <div class="flex justify-between items-start">
                      <h4 class="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors item-name">${itemName}</h4>
                    </div>
                    ${tagsHtml ? `<div class="flex flex-wrap gap-1 mt-1">${tagsHtml}</div>` : ''}
                    ${itemDesc ? `<p class="text-sm text-gray-500 line-clamp-3 leading-relaxed item-desc">${escapeHtml(itemDesc)}</p>` : ''}
                    ${allergensHtml}
                  </div>
                  <div class="flex justify-between items-center mt-5 pt-4 border-t border-gray-50">
                    <span class="text-lg font-black text-accent">${itemPrice}</span>
                    ${item.is_available === 0 ? `<span class="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">Out of stock</span>` : ''}
                  </div>
                </div>
              </div>`;
          }
          html += `</div>`;
        } else {
          // List layout
          html += `<ul class="space-y-4">`;
          for (const item of items) {
            const itemTr = itemTranslations.get(item.id)?.get(langCode);
            const itemName = escapeHtml(itemTr?.name ?? item.name ?? '');
            const itemDesc = itemTr?.description ?? item.description ?? '';
            const itemPrice = `${currencySymbol}${(Number(item.price) / 100).toFixed(2)}`;
            const itemImg = item.image_url
              ? `<img src="${escapeHtml(item.image_url)}" alt="${itemName}" class="w-20 h-20 object-cover rounded-xl flex-shrink-0" />`
              : '';

            let tagsHtml = '';
            if (item.is_vegan === 1) tagsHtml += `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full" data-en="Vegan" data-tr="Vegan">Vegan</span> `;
            if (item.is_gluten_free === 1) tagsHtml += `<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full" data-en="Gluten-Free" data-tr="Glutensiz">Gluten-Free</span> `;
            
            let allergensHtml = '';
            if (item.allergens) {
              try {
                const arr = JSON.parse(item.allergens);
                if (arr.length > 0) {
                  allergensHtml = `<p class="text-[10px] text-gray-400 mt-1"><span class="font-semibold" data-en="Allergens:" data-tr="Alerjenler:">Allergens:</span> ${escapeHtml(arr.join(', '))}</p>`;
                }
              } catch (e) {}
            }

            html += `
              <li class="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/20 transition-all gap-4 shadow-sm item-card" data-is-vegan="${item.is_vegan === 1}" data-is-gluten-free="${item.is_gluten_free === 1}">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  ${itemImg}
                  <div class="min-w-0">
                    <h4 class="text-base font-bold text-gray-900 item-name">${itemName}</h4>
                    ${tagsHtml ? `<div class="flex flex-wrap gap-1 mt-1">${tagsHtml}</div>` : ''}
                    ${itemDesc ? `<p class="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed item-desc">${escapeHtml(itemDesc)}</p>` : ''}
                    ${allergensHtml}
                  </div>
                </div>
                <div class="text-lg font-black text-accent whitespace-nowrap">${itemPrice}</div>
              </li>`;
          }
          html += `</ul>`;
        }
      }

      html += `</div></div>`;
    }
  }

  html += `</div>`;
  return html;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

app.use('/*', cors());
app.use('/api/*', requireAuth());

const requireOrgMembership = () => createMiddleware(async (c, next) => {
  const userPayload = c.get('user') as UserPayload;
  const dbUser = await c.env.DB.prepare('SELECT org_id FROM users WHERE id = ?').bind(userPayload.id).first() as { org_id: string | null } | undefined;
  c.set('user', { ...userPayload, org_id: dbUser?.org_id });
  await next();
});

app.use('/api/*', requireOrgMembership());

// ---------------------------------------------------------------------------
// Users / Auth
// ---------------------------------------------------------------------------

app.get('/api/me', async (c) => {
  const userPayload = c.get('user') as UserPayload;
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userPayload.id).first() as any;

  if (!user || !user.org_id) {
    return c.json({ needs_onboarding: true });
  }

  return c.json({
    id: user.id,
    org_id: user.org_id,
    email: user.email,
    roles: userPayload.roles,
    needs_onboarding: false
  });
});

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

app.post('/api/organizations', async (c) => {
  const userPayload = c.get('user') as UserPayload;
  const body = await c.req.json();
  const orgId = `org_${crypto.randomUUID()}`;

  await c.env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)')
    .bind(orgId, body.name)
    .run();

  const emailPlaceholder = body.email || `${userPayload.id}@auth0.user`;
  await c.env.DB.prepare(`
    INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET org_id = excluded.org_id
  `).bind(userPayload.id, orgId, emailPlaceholder, 'org_owner').run();

  if (body.surveyResponses && Array.isArray(body.surveyResponses)) {
    for (const resp of body.surveyResponses) {
      const surveyId = `survey_${crypto.randomUUID()}`;
      await c.env.DB.prepare('INSERT INTO onboarding_survey_responses (id, user_id, question, answer) VALUES (?, ?, ?, ?)')
        .bind(surveyId, userPayload.id, resp.question, resp.answer)
        .run();
    }
  }

  try {
    const auth0Mgmt = new Auth0ManagementClient({
      AUTH0_DOMAIN: c.env.AUTH0_DOMAIN,
      AUTH0_M2M_CLIENT_ID: c.env.AUTH0_M2M_CLIENT_ID,
      AUTH0_M2M_CLIENT_SECRET: c.env.AUTH0_M2M_CLIENT_SECRET,
    });
    await auth0Mgmt.assignRolesToUser(userPayload.id, [c.env.AUTH0_ORG_OWNER_ROLE_ID]);
  } catch (err) {
    console.error('Failed to assign Auth0 role:', err);
  }

  return c.json({ id: orgId, name: body.name }, 201);
});

app.get('/api/organizations', async (c) => {
  const userPayload = c.get('user') as UserPayload;

  if (userPayload.roles.includes('superadmin')) {
    const { results } = await c.env.DB.prepare('SELECT * FROM organizations').all();
    return c.json(results);
  }

  const user = await c.env.DB.prepare('SELECT org_id FROM users WHERE id = ?').bind(userPayload.id).first() as any;
  if (!user || !user.org_id) return c.json([]);

  const { results } = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).all();
  return c.json(results);
});

app.get('/api/organizations/:org_id', requireRole('org_owner'), async (c) => {
  const orgId = c.req.param('org_id');
  const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first() as any;
  if (!org) return c.json({ error: 'Organization not found' }, 404);
  return c.json(org);
});

app.patch('/api/organizations/:org_id', requireRole('org_owner'), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT id FROM organizations WHERE id = ?').bind(orgId).first();
  if (!existing) return c.json({ error: 'Organization not found' }, 404);

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
  const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim().toUpperCase() : null;
  const currencySymbol = typeof body.currency_symbol === 'string' && body.currency_symbol.trim() ? body.currency_symbol.trim() : null;

  await c.env.DB.prepare(`
    UPDATE organizations
    SET name            = COALESCE(?, name),
        currency        = COALESCE(?, currency),
        currency_symbol = COALESCE(?, currency_symbol)
    WHERE id = ?
  `).bind(name, currency, currencySymbol, orgId).run();

  const updated = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
  return c.json(updated);
});

// ---------------------------------------------------------------------------
// Organisation Languages
// ---------------------------------------------------------------------------

app.get('/api/organizations/:org_id/languages', requireRole(['org_owner', 'org_staff']), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM org_languages WHERE org_id = ? ORDER BY sort_order ASC'
  ).bind(orgId).all();
  return c.json(results);
});

app.post('/api/organizations/:org_id/languages', requireRole(['org_owner', 'org_staff']), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const id = `lang_${crypto.randomUUID()}`;
  const langCode = String(body.language_code ?? '').trim().toLowerCase();
  const langName = String(body.language_name ?? '').trim();
  const isDefault = body.is_default ? 1 : 0;
  const sortOrder = Number(body.sort_order ?? 0);

  if (!langCode || !langName) {
    return c.json({ error: 'language_code and language_name are required' }, 400);
  }

  // If setting as default, demote all others first
  if (isDefault) {
    await c.env.DB.prepare('UPDATE org_languages SET is_default = 0 WHERE org_id = ?').bind(orgId).run();
  }

  await c.env.DB.prepare(
    'INSERT INTO org_languages (id, org_id, language_code, language_name, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, orgId, langCode, langName, isDefault, sortOrder).run();

  return c.json({ id, org_id: orgId, language_code: langCode, language_name: langName, is_default: isDefault, sort_order: sortOrder }, 201);
});

app.delete('/api/organizations/:org_id/languages/:lang_code', requireRole(['org_owner', 'org_staff']), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const langCode = c.req.param('lang_code');

  const lang = await c.env.DB.prepare(
    'SELECT * FROM org_languages WHERE org_id = ? AND language_code = ?'
  ).bind(orgId, langCode).first() as any;

  if (!lang) return c.json({ error: 'Language not found' }, 404);
  if (lang.is_default) return c.json({ error: 'Cannot delete the default language' }, 400);

  await c.env.DB.prepare(
    'DELETE FROM org_languages WHERE org_id = ? AND language_code = ?'
  ).bind(orgId, langCode).run();

  return c.json({ success: true });
});

app.patch('/api/organizations/:org_id/languages/:lang_code', requireRole(['org_owner', 'org_staff']), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const langCode = c.req.param('lang_code');
  const body = await c.req.json();
  const isDefault = body.is_default ? 1 : 0;

  const lang = await c.env.DB.prepare(
    'SELECT * FROM org_languages WHERE org_id = ? AND language_code = ?'
  ).bind(orgId, langCode).first() as any;

  if (!lang) return c.json({ error: 'Language not found' }, 404);

  if (isDefault) {
    await c.env.DB.prepare('UPDATE org_languages SET is_default = 0 WHERE org_id = ?').bind(orgId).run();
  }

  await c.env.DB.prepare(
    'UPDATE org_languages SET is_default = ? WHERE org_id = ? AND language_code = ?'
  ).bind(isDefault, orgId, langCode).run();

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Category Translations
// ---------------------------------------------------------------------------

app.get('/api/categories/:category_id/translations', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM category_translations WHERE category_id = ?'
  ).bind(categoryId).all();
  return c.json(results);
});

app.put('/api/categories/:category_id/translations/:lang_code', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const langCode = c.req.param('lang_code');
  const body = await c.req.json();
  const name = String(body.name ?? '').trim();

  if (!name) return c.json({ error: 'name is required' }, 400);

  const id = `ctr_${crypto.randomUUID()}`;
  await c.env.DB.prepare(`
    INSERT INTO category_translations (id, category_id, language_code, name)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(category_id, language_code) DO UPDATE SET name = excluded.name
  `).bind(id, categoryId, langCode, name).run();

  return c.json({ category_id: categoryId, language_code: langCode, name });
});

// ---------------------------------------------------------------------------
// Item Translations
// ---------------------------------------------------------------------------

app.get('/api/items/:item_id/translations', requireRole(['org_owner', 'org_staff']), async (c) => {
  const itemId = c.req.param('item_id');
  if (!(await verifyOwnership(c, 'item', itemId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM item_translations WHERE item_id = ?'
  ).bind(itemId).all();
  return c.json(results);
});

app.put('/api/items/:item_id/translations/:lang_code', requireRole(['org_owner', 'org_staff']), async (c) => {
  const itemId = c.req.param('item_id');
  if (!(await verifyOwnership(c, 'item', itemId))) return c.json({ error: 'Forbidden' }, 403);
  const langCode = c.req.param('lang_code');
  const body = await c.req.json();
  const name = String(body.name ?? '').trim();
  const description = body.description != null ? String(body.description).trim() : null;

  if (!name) return c.json({ error: 'name is required' }, 400);

  const id = `itr_${crypto.randomUUID()}`;
  await c.env.DB.prepare(`
    INSERT INTO item_translations (id, item_id, language_code, name, description)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(item_id, language_code) DO UPDATE SET name = excluded.name, description = excluded.description
  `).bind(id, itemId, langCode, name, description ?? null).run();

  return c.json({ item_id: itemId, language_code: langCode, name, description });
});

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

app.post('/api/organizations/:org_id/venues', requireRole('org_owner'), async (c) => {
  const orgId = c.req.param('org_id');
  if (!(await verifyOwnership(c, 'org', orgId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();
  const id = `venue_${crypto.randomUUID()}`;

  await c.env.DB.prepare('INSERT INTO venues (id, org_id, name, slug) VALUES (?, ?, ?, ?)')
    .bind(id, orgId, body.name, body.slug)
    .run();

  return c.json({ id, org_id: orgId, name: body.name, slug: body.slug }, 201);
});

app.get('/api/venues', requireRole(['org_owner', 'org_staff']), async (c) => {
  const user = c.get('user') as UserPayload & { org_id?: string | null };
  if (user.roles.includes('superadmin')) {
    const { results } = await c.env.DB.prepare('SELECT * FROM venues').all();
    return c.json(results);
  }
  if (!user.org_id) return c.json([]);
  const { results } = await c.env.DB.prepare('SELECT * FROM venues WHERE org_id = ?').bind(user.org_id).all();
  return c.json(results);
});

app.get('/api/venues/:venue_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const venueId = c.req.param('venue_id');
  if (!(await verifyOwnership(c, 'venue', venueId))) return c.json({ error: 'Forbidden' }, 403);
  const venue = await c.env.DB.prepare('SELECT * FROM venues WHERE id = ?').bind(venueId).first();
  if (!venue) {
    return c.json({ error: 'Venue not found' }, 404);
  }
  return c.json(venue);
});

app.patch('/api/venues/:venue_id', requireRole('org_owner'), async (c) => {
  const venueId = c.req.param('venue_id');
  if (!(await verifyOwnership(c, 'venue', venueId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT * FROM venues WHERE id = ?').bind(venueId).first() as any;
  if (!existing) {
    return c.json({ error: 'Venue not found' }, 404);
  }

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name;
  const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : existing.slug;
  const logoUrl = body.logo_url !== undefined ? body.logo_url : existing.logo_url;
  const website = body.website !== undefined ? body.website : existing.website;
  const facebook = body.facebook !== undefined ? body.facebook : existing.facebook;
  const instagram = body.instagram !== undefined ? body.instagram : existing.instagram;
  const twitter = body.twitter !== undefined ? body.twitter : existing.twitter;
  const phone = body.phone !== undefined ? body.phone : existing.phone;
  const address = body.address !== undefined ? body.address : existing.address;
  const email = body.email !== undefined ? body.email : existing.email;

  const themeId = typeof body.theme_id === 'string' ? body.theme_id : existing.theme_id;
  const primaryColor = typeof body.primary_color === 'string' ? body.primary_color : existing.primary_color;
  const accentColor = typeof body.accent_color === 'string' ? body.accent_color : existing.accent_color;
  const backgroundColor = typeof body.background_color === 'string' ? body.background_color : existing.background_color;
  const themeFont = typeof body.theme_font === 'string' ? body.theme_font : existing.theme_font;
  const layoutStyle = typeof body.layout_style === 'string' ? body.layout_style : existing.layout_style;

  await c.env.DB.prepare(`
    UPDATE venues
    SET name = ?,
        slug = ?,
        logo_url = ?,
        website = ?,
        facebook = ?,
        instagram = ?,
        twitter = ?,
        phone = ?,
        address = ?,
        email = ?,
        theme_id = ?,
        primary_color = ?,
        accent_color = ?,
        background_color = ?,
        theme_font = ?,
        layout_style = ?
    WHERE id = ?
  `).bind(
    name,
    slug,
    logoUrl,
    website,
    facebook,
    instagram,
    twitter,
    phone,
    address,
    email,
    themeId,
    primaryColor,
    accentColor,
    backgroundColor,
    themeFont,
    layoutStyle,
    venueId
  ).run();

  const updated = await c.env.DB.prepare('SELECT * FROM venues WHERE id = ?').bind(venueId).first();
  return c.json(updated);
});

// ---------------------------------------------------------------------------
// Compile (publish to edge)
// ---------------------------------------------------------------------------

app.post('/api/venues/:venue_id/compile', requireRole(['org_owner', 'org_staff']), async (c) => {
  const venueId = c.req.param('venue_id');
  if (!(await verifyOwnership(c, 'venue', venueId))) return c.json({ error: 'Forbidden' }, 403);

  const venue = await c.env.DB.prepare('SELECT * FROM venues WHERE id = ?').bind(venueId).first() as any;
  if (!venue) return c.json({ error: 'Venue not found' }, 404);

  const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(venue.org_id).first() as any;
  const currencySymbol = escapeHtml(org?.currency_symbol ?? '$');

  // Fetch languages — Turkish is default, English is implicit fallback
  const { results: orgLanguages } = await c.env.DB.prepare(
    'SELECT * FROM org_languages WHERE org_id = ? ORDER BY sort_order ASC'
  ).bind(venue.org_id).all() as { results: any[] };

  // Always include English as the fallback language, not in the switcher if not explicitly added
  const defaultLang = orgLanguages.find((l: any) => l.is_default) ?? { language_code: 'tr', language_name: 'Türkçe', is_default: 1 };
  const fallbackLangCode = 'en';

  // Build the ordered language list: default first, then rest
  const sortedLangs = [
    defaultLang,
    ...orgLanguages.filter((l: any) => !l.is_default)
  ];

  // If English is not in org_languages, add it as a switcher option anyway
  const hasEnglish = orgLanguages.some((l: any) => l.language_code === 'en');
  if (!hasEnglish) {
    sortedLangs.push({ language_code: 'en', language_name: 'English', is_default: 0 });
  }

  const { results: activeMenus } = await c.env.DB.prepare(
    'SELECT * FROM menus WHERE venue_id = ? AND is_active = 1'
  ).bind(venueId).all();
  const menus = activeMenus as any[];

  // Fetch active categories — COALESCE treats NULL as 1 (active) for safety
  let categoriesByMenu = new Map<string, any[]>();
  let itemsByCategory = new Map<string, any[]>();
  let catTranslations = new Map<string, Map<string, { name: string }>>();
  let itemTranslations = new Map<string, Map<string, { name: string; description: string | null }>>();

  for (const menu of menus) {
    const { results: cats } = await c.env.DB.prepare(
      'SELECT * FROM categories WHERE menu_id = ? AND COALESCE(is_active, 1) = 1 ORDER BY sort_order ASC'
    ).bind(menu.id).all();
    categoriesByMenu.set(menu.id, cats as any[]);

    for (const cat of cats as any[]) {
      // Items — COALESCE treats NULL as 1 (available) for safety
      const { results: items } = await c.env.DB.prepare(
        'SELECT * FROM items WHERE category_id = ? AND COALESCE(is_available, 1) = 1'
      ).bind(cat.id).all();
      itemsByCategory.set(cat.id, items as any[]);

      // Category translations
      const { results: cTrs } = await c.env.DB.prepare(
        'SELECT * FROM category_translations WHERE category_id = ?'
      ).bind(cat.id).all();
      const cMap = new Map<string, { name: string }>();
      for (const tr of cTrs as any[]) cMap.set(tr.language_code, { name: tr.name });
      catTranslations.set(cat.id, cMap);

      // Item translations
      for (const item of items as any[]) {
        const { results: iTrs } = await c.env.DB.prepare(
          'SELECT * FROM item_translations WHERE item_id = ?'
        ).bind(item.id).all();
        const iMap = new Map<string, { name: string; description: string | null }>();
        for (const tr of iTrs as any[]) iMap.set(tr.language_code, { name: tr.name, description: tr.description ?? null });
        itemTranslations.set(item.id, iMap);
      }
    }
  }

  // Build JSON-LD Schema
  const hasMenuSections: any[] = [];
  for (const menu of menus) {
    const cats = categoriesByMenu.get(menu.id) ?? [];
    for (const cat of cats) {
      const items = itemsByCategory.get(cat.id) ?? [];
      const menuItems = items.map(item => ({
        "@type": "MenuItem",
        "name": item.name,
        "description": item.description || undefined,
        "offers": {
          "@type": "Offer",
          "price": (Number(item.price) / 100).toFixed(2),
          "priceCurrency": org?.currency || "USD"
        }
      }));
      
      hasMenuSections.push({
        "@type": "MenuSection",
        "name": cat.name,
        "hasMenuItem": menuItems
      });
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": venue.name,
    "image": venue.logo_url || undefined,
    "telephone": venue.phone || undefined,
    "address": venue.address ? {
      "@type": "PostalAddress",
      "streetAddress": venue.address
    } : undefined,
    "hasMenu": {
      "@type": "Menu",
      "name": `${venue.name} Menu`,
      "hasMenuSection": hasMenuSections
    }
  };
  const jsonLdString = JSON.stringify(jsonLd, null, 2);

  const venueName = escapeHtml(venue.name ?? '');
  const showSubHeader = menus.length === 1 && menus[0].name;
  const subHeaderHtml = showSubHeader ? `<p class="text-center text-white/80 mt-2 font-medium">${escapeHtml(menus[0].name)}</p>` : '';

  // Font family mappings
  let fontLink = '';
  let fontFamilyName = 'Inter';
  const themeFont = venue.theme_font ?? 'sans';
  if (themeFont === 'serif') {
    fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';
    fontFamilyName = "'Playfair Display'";
  } else if (themeFont === 'rounded') {
    fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">';
    fontFamilyName = "'Outfit'";
  } else if (themeFont === 'modern') {
    fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">';
    fontFamilyName = "'Poppins'";
  } else {
    fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">';
    fontFamilyName = "'Inter'";
  }

  // Logo html
  const logoHtml = venue.logo_url
    ? `<img src="${escapeHtml(venue.logo_url)}" alt="${venueName} Logo" class="w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-lg mb-4 hover:scale-105 transition-transform duration-300" />`
    : '';

  // Footer compilation
  let footerHtml = '';
  const hasSocials = venue.website || venue.facebook || venue.instagram || venue.twitter;
  const hasContact = venue.phone || venue.address || venue.email;

  if (hasSocials || hasContact) {
    footerHtml += `<div class="bg-white rounded-2xl border border-gray-100 p-8 mt-6 shadow-sm text-center space-y-6">`;

    if (hasSocials) {
      footerHtml += `<div class="flex justify-center items-center gap-4">`;
      if (venue.website) {
        footerHtml += `<a href="${escapeHtml(venue.website)}" target="_blank" class="p-3 bg-gray-50 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300" title="Website">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
        </a>`;
      }
      if (venue.instagram) {
        footerHtml += `<a href="${escapeHtml(venue.instagram)}" target="_blank" class="p-3 bg-gray-50 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300" title="Instagram">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        </a>`;
      }
      if (venue.facebook) {
        footerHtml += `<a href="${escapeHtml(venue.facebook)}" target="_blank" class="p-3 bg-gray-50 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300" title="Facebook">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
        </a>`;
      }
      if (venue.twitter) {
        footerHtml += `<a href="${escapeHtml(venue.twitter)}" target="_blank" class="p-3 bg-gray-50 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300" title="Twitter">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z"/></svg>
        </a>`;
      }
      footerHtml += `</div>`;
    }

    if (hasContact) {
      footerHtml += `<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">`;
      if (venue.phone) {
        footerHtml += `<a href="tel:${escapeHtml(venue.phone)}" class="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all duration-300 font-semibold text-sm">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          Call Us
        </a>`;
      }
      if (venue.email) {
        footerHtml += `<a href="mailto:${escapeHtml(venue.email)}" class="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all duration-300 font-semibold text-sm">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          Email Us
        </a>`;
      }
      if (venue.address) {
        footerHtml += `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}" target="_blank" class="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all duration-300 font-semibold text-sm">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Find Us
        </a>`;
      }
      footerHtml += `</div>`;

      if (venue.address) {
        footerHtml += `<p class="text-xs text-gray-400 mt-4">${escapeHtml(venue.address)}</p>`;
      }
    }

    footerHtml += `</div>`;
  }

  const seoTitle = `${venueName} Menu`;
  const seoDesc = `View the full online digital menu of ${venueName}. Browse menu categories, items, live prices, and availability.`;

  for (let i = 0; i < sortedLangs.length; i++) {
    const lang = sortedLangs[i];
    let contentHtml = '';
    if (menus.length === 0) {
      contentHtml = `<p class="text-center text-gray-500 italic py-8">No active menu available right now.</p>`;
    } else {
      contentHtml = buildLangBlock(
        lang.language_code,
        i === 0,
        currencySymbol,
        menus,
        categoriesByMenu,
        itemsByCategory,
        catTranslations,
        itemTranslations,
        venue.layout_style ?? 'list'
      );
    }

    const switcherButtons = sortedLangs.map((l: any) =>
      `<a href="?lang=${escapeHtml(l.language_code)}" ` +
      `class="lang-btn px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${l.language_code === lang.language_code ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}"` +
      `>${escapeHtml(l.language_name)}</a>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="${escapeHtml(lang.language_code)}">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-S5L6XWQGWC"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-S5L6XWQGWC');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDesc}">
  <link rel="canonical" href="/${venue.slug}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDesc}">
  ${venue.logo_url ? `<meta property="og:image" content="${venue.logo_url}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDesc}">
  ${venue.logo_url ? `<meta name="twitter:image" content="${venue.logo_url}">` : ''}

  <!-- Font integration -->
  ${fontLink}
  
  <!-- Inline Compiled CSS Stylesheet -->
  <style>
    :root {
      --primary: ${venue.primary_color ?? '#4f46e5'};
      --accent: ${venue.accent_color ?? '#312e81'};
      --background: ${venue.background_color ?? '#f3f4f6'};
    }
    body {
      font-family: ${fontFamilyName}, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    ${MENU_CSS}
  </style>

  <!-- Structured Data JSON-LD Schema -->
  <script type="application/ld+json">
${jsonLdString}
  </script>
</head>
<body class="bg-background text-gray-900 min-h-screen p-4 md:p-8">
  <div class="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-2rem)] justify-between">
    <div>
      <div class="bg-primary px-8 py-10 text-white rounded-t-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-md">
        <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
        ${logoHtml}
        <h1 class="text-3xl font-black tracking-tight">${venueName}</h1>
        ${subHeaderHtml}
        <div class="flex justify-center gap-2 mt-5 flex-wrap">
          ${switcherButtons}
        </div>
      </div>
      <div class="bg-background py-6 space-y-6" id="menu-content">
        ${contentHtml}
      </div>
    </div>
    ${footerHtml}
  </div>
  <script>
    (function () {
      // Search and Filter Logic
      var activeFilters = { vegan: false, gf: false };
      
      function applyFilters() {
        var term = '';
        var searchInput = document.querySelector('.search-input');
        if (searchInput) term = (searchInput.value || '').toLowerCase();

        document.querySelectorAll('.item-card').forEach(function(card) {
           var name = (card.querySelector('.item-name').textContent || '').toLowerCase();
           var descEl = card.querySelector('.item-desc');
           var desc = descEl ? (descEl.textContent || '').toLowerCase() : '';
           var isVegan = card.dataset.isVegan === 'true';
           var isGf = card.dataset.isGlutenFree === 'true';

           var matchSearch = name.includes(term) || desc.includes(term);
           var matchVegan = !activeFilters.vegan || isVegan;
           var matchGf = !activeFilters.gf || isGf;

           if (matchSearch && matchVegan && matchGf) {
              card.style.display = '';
           } else {
              card.style.display = 'none';
           }
        });
      }

      document.querySelectorAll('.filter-vegan-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          activeFilters.vegan = !activeFilters.vegan;
          document.querySelectorAll('.filter-vegan-btn').forEach(function(b) {
             b.classList.toggle('bg-green-500', activeFilters.vegan);
             b.classList.toggle('text-white', activeFilters.vegan);
             b.classList.toggle('border-green-500', activeFilters.vegan);
             b.classList.toggle('bg-white', !activeFilters.vegan);
             b.classList.toggle('text-gray-600', !activeFilters.vegan);
             b.classList.toggle('border-gray-200', !activeFilters.vegan);
          });
          applyFilters();
        });
      });

      document.querySelectorAll('.filter-gf-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          activeFilters.gf = !activeFilters.gf;
          document.querySelectorAll('.filter-gf-btn').forEach(function(b) {
             b.classList.toggle('bg-yellow-500', activeFilters.gf);
             b.classList.toggle('text-white', activeFilters.gf);
             b.classList.toggle('border-yellow-500', activeFilters.gf);
             b.classList.toggle('bg-white', !activeFilters.gf);
             b.classList.toggle('text-gray-600', !activeFilters.gf);
             b.classList.toggle('border-gray-200', !activeFilters.gf);
          });
          applyFilters();
        });
      });

      document.querySelectorAll('.search-input').forEach(function(input) {
        input.addEventListener('input', function(e) {
          applyFilters();
        });
      });
    })();
  </script>
</body>
</html>`;

    await c.env.MENU_KV.put(`html:venue::${venue.slug}::${lang.language_code}`, html);
    if (i === 0) {
      await c.env.MENU_KV.put(`html:venue::${venue.slug}`, html);
    }
  }

  return c.json({ success: true, slug: venue.slug });
});

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

app.get('/api/menus/:menu_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const menuId = c.req.param('menu_id');
  if (!(await verifyOwnership(c, 'menu', menuId))) return c.json({ error: 'Forbidden' }, 403);
  const menu = await c.env.DB.prepare('SELECT * FROM menus WHERE id = ?').bind(menuId).first() as any;
  if (!menu) return c.json({ error: 'Menu not found' }, 404);
  return c.json(menu);
});

app.post('/api/venues/:venue_id/menus', requireRole(['org_owner', 'org_staff']), async (c) => {
  const venueId = c.req.param('venue_id');
  if (!(await verifyOwnership(c, 'venue', venueId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();
  const id = `menu_${crypto.randomUUID()}`;

  await c.env.DB.prepare('INSERT INTO menus (id, venue_id, name, is_active) VALUES (?, ?, ?, ?)')
    .bind(id, venueId, body.name, body.is_active ? 1 : 0)
    .run();

  return c.json({ id, venue_id: venueId, name: body.name, is_active: body.is_active ? 1 : 0 }, 201);
});

app.get('/api/venues/:venue_id/menus', requireRole(['org_owner', 'org_staff']), async (c) => {
  const venueId = c.req.param('venue_id');
  if (!(await verifyOwnership(c, 'venue', venueId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare('SELECT * FROM menus WHERE venue_id = ?').bind(venueId).all();
  return c.json(results);
});

app.patch('/api/menus/:menu_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const menuId = c.req.param('menu_id');
  if (!(await verifyOwnership(c, 'menu', menuId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT * FROM menus WHERE id = ?').bind(menuId).first() as any;
  if (!existing) return c.json({ error: 'Menu not found' }, 404);

  const name = typeof body.name === 'string' ? body.name.trim() : existing.name;
  const isActive = typeof body.is_active === 'boolean' ? (body.is_active ? 1 : 0) : existing.is_active;

  await c.env.DB.prepare('UPDATE menus SET name = ?, is_active = ? WHERE id = ?').bind(name, isActive, menuId).run();

  return c.json({ ...existing, name, is_active: isActive });
});

app.delete('/api/menus/:menu_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const menuId = c.req.param('menu_id');
  if (!(await verifyOwnership(c, 'menu', menuId))) return c.json({ error: 'Forbidden' }, 403);
  const existing = await c.env.DB.prepare('SELECT * FROM menus WHERE id = ?').bind(menuId).first() as any;
  if (!existing) return c.json({ error: 'Menu not found' }, 404);

  await c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(menuId).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

app.get('/api/menus/:menu_id/categories', requireRole(['org_owner', 'org_staff']), async (c) => {
  const menuId = c.req.param('menu_id');
  if (!(await verifyOwnership(c, 'menu', menuId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE menu_id = ? ORDER BY sort_order ASC'
  ).bind(menuId).all();
  return c.json(results);
});

app.post('/api/menus/:menu_id/categories', requireRole(['org_owner', 'org_staff']), async (c) => {
  const menuId = c.req.param('menu_id');
  if (!(await verifyOwnership(c, 'menu', menuId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();
  const id = `cat_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    'INSERT INTO categories (id, menu_id, name, sort_order, cover_image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, menuId, body.name, body.sort_order ?? 0, body.cover_image_url ?? null, 1).run();

  return c.json({ id, menu_id: menuId, name: body.name, sort_order: body.sort_order ?? 0, cover_image_url: body.cover_image_url ?? null, is_active: 1 }, 201);
});

app.patch('/api/categories/:category_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(categoryId).first() as any;
  if (!existing) return c.json({ error: 'Category not found' }, 404);

  const name = typeof body.name === 'string' ? body.name.trim() : existing.name;
  const sortOrder = typeof body.sort_order === 'number' ? body.sort_order : existing.sort_order;
  const coverImageUrl = body.cover_image_url !== undefined ? body.cover_image_url : existing.cover_image_url;
  const isActive = typeof body.is_active === 'boolean' ? (body.is_active ? 1 : 0) : existing.is_active;

  await c.env.DB.prepare('UPDATE categories SET name = ?, sort_order = ?, cover_image_url = ?, is_active = ? WHERE id = ?')
    .bind(name, sortOrder, coverImageUrl, isActive, categoryId)
    .run();

  return c.json({ ...existing, name, sort_order: sortOrder, cover_image_url: coverImageUrl, is_active: isActive });
});

app.delete('/api/categories/:category_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(categoryId).first() as any;
  if (!existing) return c.json({ error: 'Category not found' }, 404);

  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(categoryId).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

app.get('/api/categories/:category_id/items', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB.prepare('SELECT * FROM items WHERE category_id = ?').bind(categoryId).all();
  return c.json(results);
});

app.post('/api/categories/:category_id/items', requireRole(['org_owner', 'org_staff']), async (c) => {
  const categoryId = c.req.param('category_id');
  if (!(await verifyOwnership(c, 'category', categoryId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();
  const id = `item_${crypto.randomUUID()}`;

  const priceMinorUnits = Math.round(Number(body.price) * 100);

  const isVegan = body.is_vegan ? 1 : 0;
  const isGlutenFree = body.is_gluten_free ? 1 : 0;
  
  // Parse comma-separated allergens into JSON array
  let allergensJson = null;
  if (typeof body.allergens === 'string') {
    const arr = body.allergens.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    if (arr.length > 0) allergensJson = JSON.stringify(arr);
  }

  await c.env.DB.prepare(
    'INSERT INTO items (id, category_id, name, description, price, is_available, image_url, is_vegan, is_gluten_free, allergens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, categoryId, body.name, body.description ?? '', priceMinorUnits, 
    body.is_available === false ? 0 : 1, body.image_url ?? null,
    isVegan, isGlutenFree, allergensJson
  ).run();

  return c.json({ 
    id, category_id: categoryId, name: body.name, price: priceMinorUnits, 
    image_url: body.image_url ?? null, is_vegan: isVegan, 
    is_gluten_free: isGlutenFree, allergens: allergensJson 
  }, 201);
});

app.patch('/api/items/:item_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const itemId = c.req.param('item_id');
  if (!(await verifyOwnership(c, 'item', itemId))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();

  const existing = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(itemId).first() as any;
  if (!existing) return c.json({ error: 'Item not found' }, 404);

  const name = typeof body.name === 'string' ? body.name.trim() : existing.name;
  const description = typeof body.description === 'string' ? body.description.trim() : existing.description;

  let priceMinorUnits = existing.price;
  if (body.price !== undefined && body.price !== null) {
    priceMinorUnits = Math.round(Number(body.price) * 100);
  }

  const imageUrl = body.image_url !== undefined ? body.image_url : existing.image_url;
  const isAvailable = typeof body.is_available === 'boolean' ? (body.is_available ? 1 : 0) : existing.is_available;

  const isVegan = body.is_vegan !== undefined ? (body.is_vegan ? 1 : 0) : existing.is_vegan;
  const isGlutenFree = body.is_gluten_free !== undefined ? (body.is_gluten_free ? 1 : 0) : existing.is_gluten_free;

  let allergensJson = existing.allergens;
  if (body.allergens !== undefined) {
    if (typeof body.allergens === 'string') {
      const arr = body.allergens.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      allergensJson = arr.length > 0 ? JSON.stringify(arr) : null;
    } else {
      allergensJson = null;
    }
  }

  await c.env.DB.prepare('UPDATE items SET name = ?, description = ?, price = ?, image_url = ?, is_available = ?, is_vegan = ?, is_gluten_free = ?, allergens = ? WHERE id = ?')
    .bind(name, description, priceMinorUnits, imageUrl, isAvailable, isVegan, isGlutenFree, allergensJson, itemId)
    .run();

  return c.json({ 
    ...existing, name, description, price: priceMinorUnits, 
    image_url: imageUrl, is_available: isAvailable,
    is_vegan: isVegan, is_gluten_free: isGlutenFree, allergens: allergensJson
  });
});

app.delete('/api/items/:item_id', requireRole(['org_owner', 'org_staff']), async (c) => {
  const itemId = c.req.param('item_id');
  if (!(await verifyOwnership(c, 'item', itemId))) return c.json({ error: 'Forbidden' }, 403);
  const existing = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(itemId).first() as any;
  if (!existing) return c.json({ error: 'Item not found' }, 404);

  await c.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(itemId).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// File uploads (R2)
// ---------------------------------------------------------------------------

app.post('/api/uploads', requireRole(['org_owner', 'org_staff']), async (c) => {
  try {
    const formData = await c.req.parseBody();
    const file = formData['file'];

    if (!(file instanceof File)) {
      return c.json({ error: 'File is required' }, 400);
    }

    if (file.type !== 'image/webp' && !file.name.endsWith('.webp')) {
      return c.json({ error: 'Only WebP images are allowed. Please compress on the client.' }, 400);
    }

    const ext = file.name.split('.').pop();
    const id = `${crypto.randomUUID()}.${ext}`;

    await c.env.UPLOADS_BUCKET.put(id, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    return c.json({ url: `/uploads/${id}` }, 201);
  } catch (err: any) {
    console.error('Upload Error:', err);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

app.get('/uploads/:id', async (c) => {
  const id = c.req.param('id');
  const object = await c.env.UPLOADS_BUCKET.get(id);

  if (!object) return c.json({ error: 'Not Found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, { headers });
});

export default app;
