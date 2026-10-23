# Deployment

Hellotype is a static site (`dist/`), hosted on **Cloudflare Workers** and deployed from GitHub Actions.

```
PR opened/updated ─▶ preview.yml ─▶ ci.yml: quality ┐
                               test   ├─▶ preview (Cloudflare preview URL, commented on the PR)
                               glyphs │
                               build ─┘  (uploads `dist` artifact)

push to main ─▶ deploy.yml: ci.yml (same jobs) ─▶ deploy: downloads that `dist` ─▶ Cloudflare Workers (production)
```

The deploy job ships the exact artifact CI built; it never rebuilds.

## One-time setup

The site is a Cloudflare **Worker with static assets** named `hello-type` (see `wrangler.jsonc`), served at `https://hello-type.<subdomain>.workers.dev`.

1. **Worker.** Create it in the Cloudflare dashboard with the name `hello-type` (done). Under Settings → Domains & Routes, enable the `workers.dev` URL and the **Preview URLs** toggle (needed for PR previews).
2. **API token.** My Profile → API Tokens → Create Token → _Edit Cloudflare Workers_ template. Copy your **Account ID** too.
3. **GitHub secrets.** Repo → Settings → Secrets and variables → Actions: secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. If your workers.dev subdomain isn't `amoghpadukone`, add the variable `WORKERS_SUBDOMAIN`.
4. **Environments.** `production` and `preview` are created on first run. Optionally add a required reviewer to `production`.
5. **Branch protection.** Settings → Rules → require the CI jobs before merging to `main`.
6. Push to `main`.

## Custom domain (later)

Worker → Settings → Domains & Routes → Add → Custom domain. DNS on Cloudflare is configured automatically. No workflow changes needed.

## Notes

- Response headers and caching live in `public/_headers`.
- Forked PRs get CI but no preview (forks can't read secrets).
- Dependabot (`.github/dependabot.yml`) opens weekly PRs for npm packages and Actions versions.
