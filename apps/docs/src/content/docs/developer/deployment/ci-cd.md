---
title: CI/CD Pipelines
description: Continuous Integration and Deployment workflows
---

We use GitHub Actions for our CI/CD pipelines to ensure code quality and automate deployments.

## Workflows

Our typical workflows include:

1. **Lint & Test**: Runs automatically on every pull request.
   - Checks code formatting using Prettier/ESLint.
   - Runs unit tests for affected packages.

2. **Deploy to Preview**: 
   - Cloudflare Pages automatically generates a preview URL for every pull request. This allows the team to review UI changes before merging.

3. **Deploy to Production**: 
   - Merging to the `main` branch triggers a production deployment.
   - Cloudflare Pages builds and deploys the frontend apps.
   - GitHub Actions deploys any updated Cloudflare Workers using `wrangler deploy`.
