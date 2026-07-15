import { Hono } from 'hono';
import app from './src/index';

const testApp = new Hono();
testApp.onError((err, c) => {
  return c.json({ error: err.message, stack: err.stack }, 500);
});
testApp.route('/', app);
export default testApp;
