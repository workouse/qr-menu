---
title: Cloudflare Deployment
description: How to deploy applications to Cloudflare
---

We use Cloudflare's ecosystem to host our applications, ensuring they are fast and globally distributed.

## Cloudflare Pages

Front-end applications like the `dashboard-ui` and `docs` are deployed using **Cloudflare Pages**.

1. Connect your GitHub repository to Cloudflare Pages.
2. Select the appropriate framework preset (e.g., React or Astro).
3. Set the build command:
   - For Docs: `pnpm --filter docs build`
   - Output directory: `apps/docs/dist`

## Cloudflare Workers

Backend APIs or specific serverless functions are deployed using **Cloudflare Workers**.

We use `wrangler` to deploy Workers. You can deploy manually using:
```bash
npx wrangler deploy
```
Make sure you are authenticated (`npx wrangler login`) and have the correct `wrangler.json` or `wrangler.toml` configured in the specific app/package directory.
