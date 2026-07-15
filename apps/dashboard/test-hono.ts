import { Hono } from 'hono';
import { cors } from 'hono/cors';
const app = new Hono();
app.use('/*', cors());
app.get('/api/me', (c) => c.text('Hello'));
export default app;
