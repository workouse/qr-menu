import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireAuth, requireRole } from '../src/index';

describe('Auth Middleware', () => {
  it('should reject requests without a token', async () => {
    const app = new Hono();
    app.use('/protected', requireAuth());
    app.get('/protected', (c) => c.text('ok'));

    const res = await app.request('/protected');
    expect(res.status).toBe(401);
  });

  it('should accept mocked test tokens with appropriate roles', async () => {
    const app = new Hono();
    app.use('/admin', requireAuth(), requireRole('superadmin'));
    app.get('/admin', (c) => c.text('ok'));

    // Mocking a superadmin token using our test-bypass syntax
    const res = await app.request('/admin', {
      headers: {
        Authorization: 'Bearer test_superadmin_token'
      }
    });
    
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('should reject valid tokens if role is insufficient', async () => {
    const app = new Hono();
    app.use('/admin', requireAuth(), requireRole('superadmin'));
    app.get('/admin', (c) => c.text('ok'));

    const res = await app.request('/admin', {
      headers: {
        Authorization: 'Bearer test_staff_token'
      }
    });
    
    expect(res.status).toBe(403);
  });
});
