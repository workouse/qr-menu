import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';
import crypto from 'node:crypto';

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
    MENU_KV: KVNamespace;
    LEMON_SQUEEZY_WEBHOOK_SECRET: string;
  }
}

describe('Billing & Monetization (Lemon Squeezy)', () => {
  beforeAll(async () => {
    // Setup D1 Schema
    const sqls = [sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11];
    for (const sql of sqls) {
      const cleanSql = sql.replace(/--.*/g, '');
      const statements = cleanSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await env.DB.prepare(statement).run();
      }
    }

    env.LEMON_SQUEEZY_WEBHOOK_SECRET = 'test_secret_123';

    // Setup Org A (Free Tier initially - we will test webhook upgrading it)
    await env.DB.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').bind('org_billing', 'Billing Org').run();
    await env.DB.prepare('INSERT INTO users (id, org_id, email, role) VALUES (?, ?, ?, ?)').bind('test_owner_billing', 'org_billing', 'owner@billing.com', 'org_owner').run();
  });

  const signPayload = (payload: string, secret: string) => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  };

  describe('Lemon Squeezy Webhooks', () => {
    it('rejects webhooks with invalid signatures', async () => {
      const payload = JSON.stringify({ meta: { event_name: 'subscription_created' } });
      const res = await app.request('/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'invalid_signature_hash'
        },
        body: payload
      }, env);

      expect(res.status).toBe(401);
    });

    it('processes subscription_created webhook and upgrades tier', async () => {
      const payloadObj = {
        meta: {
          event_name: 'subscription_created',
          custom_data: {
            org_id: 'org_billing'
          }
        },
        data: {
          id: 'sub_123',
          attributes: {
            status: 'active',
            product_name: 'Standard'
          }
        }
      };
      const payloadStr = JSON.stringify(payloadObj);
      const signature = signPayload(payloadStr, env.LEMON_SQUEEZY_WEBHOOK_SECRET);

      const res = await app.request('/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: payloadStr
      }, env);

      expect(res.status).toBe(200);

      const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE org_id = ?').bind('org_billing').first() as any;
      expect(sub).toBeDefined();
      expect(sub.tier).toBe('Standard');
      expect(sub.status).toBe('active');
      expect(sub.lemon_squeezy_id).toBe('sub_123');
    });

    it('processes subscription_updated webhook (e.g. downgraded to Free)', async () => {
      const payloadObj = {
        meta: {
          event_name: 'subscription_updated',
          custom_data: {
            org_id: 'org_billing'
          }
        },
        data: {
          id: 'sub_123',
          attributes: {
            status: 'active',
            product_name: 'Free'
          }
        }
      };
      const payloadStr = JSON.stringify(payloadObj);
      const signature = signPayload(payloadStr, env.LEMON_SQUEEZY_WEBHOOK_SECRET);

      const res = await app.request('/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: payloadStr
      }, env);

      expect(res.status).toBe(200);

      const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE org_id = ?').bind('org_billing').first() as any;
      expect(sub.tier).toBe('Free');
    });
  });

  describe('Resource Limits Checks', () => {
    // Org starts out at Free tier limits
    it('prevents Free tier from creating more than 1 venue', async () => {
      // First venue should succeed
      let res = await app.request('/api/organizations/org_billing/venues', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_owner_billing',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Venue 1' })
      }, env);
      expect(res.status).toBe(201);

      // Second venue should fail (403 limit exceeded)
      res = await app.request('/api/organizations/org_billing/venues', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_owner_billing',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Venue 2' })
      }, env);
      expect(res.status).toBe(403);
    });
  });
});
