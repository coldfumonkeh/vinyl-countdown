# The Vinyl Countdown

A read-only Vue app for browsing a vinyl collection synced from Discogs.

Live site: [vinyl.mattgifford.co.uk](https://vinyl.mattgifford.co.uk)

## Local development

```bash
yarn install
yarn serve
```

The app loads `public/collection.json`. For local development without Discogs credentials, use the committed placeholder file or run a sync:

```bash
cp .env.example .env
# add DISCOGS_TOKEN and DISCOGS_USERNAME
yarn sync
```

## Scripts

- `yarn serve` — local dev server
- `yarn build` — production build to `dist/` (includes SPA `404.html` for GitHub Pages)
- `yarn sync` — fetch collection from Discogs into `public/collection.json` (fast metadata-only sync)
- `SYNC_INCLUDE_TRACKLISTS=true yarn sync` — optional local-only sync that also fetches tracklists (slow for large collections)
- `yarn check-secrets` — fail if suspicious secrets appear in tracked files

## Deployment

Production deploys run via GitHub Actions (`.github/workflows/sync-and-deploy.yml`):

1. Sync collection from Discogs
2. Build the Vue app
3. Deploy to GitHub Pages

### One-time GitHub setup

1. Make the repository **public**
2. Go to **Settings → Pages → Build and deployment** and set source to **GitHub Actions**
3. Add custom domain `vinyl.mattgifford.co.uk` under **Settings → Pages → Custom domain**
4. Add a DNS record at your domain provider:
   - **CNAME** `vinyl` → `coldfumonkeh.github.io`
5. Enable **Enforce HTTPS** once DNS has propagated

### Required GitHub Secrets

Configure at [github.com/coldfumonkeh/vinyl-countdown/settings/secrets/actions](https://github.com/coldfumonkeh/vinyl-countdown/settings/secrets/actions):

| Secret | Description |
|--------|-------------|
| `DISCOGS_TOKEN` | Personal access token from [Discogs developer settings](https://www.discogs.com/settings/developers) |
| `DISCOGS_USERNAME` | Discogs username (optional; defaults to `coldfumonkeh`) |

The workflow runs daily and can be triggered manually via **Actions → Sync and Deploy → Run workflow**.

## Adding records

Add records in Discogs only. The scheduled GitHub Action will sync them automatically.
