# Installation

## Requirements

- Node.js 20+ (built and tested on Node 22)
- No external services required for local development — SQLite is a file
  on disk, auth is credentials-based

## Steps

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — leave as `file:./dev.db` for local dev.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`. Required; NextAuth
  refuses to start without it in production mode.
- `SITE_URL` — used for canonical URLs, sitemap `<loc>` values, JSON-LD, and
  the IndexNow `keyLocation`. Set this to your real domain before deploying.

```bash
npx prisma generate
npx prisma db push
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='ChangeMe123!' npx tsx prisma/seed.ts
npm run dev
```

Visit `http://localhost:3000/admin/login`.

## Production build

```bash
npm run build
npm run start
```

## Deployment notes

- **Media uploads** (`/admin/media`) write to `public/uploads/` on local
  disk via `node:fs`. This works on a traditional Node.js server but
  **not** on most serverless platforms, whose filesystem is ephemeral or
  read-only outside `/tmp`. Before deploying to serverless, swap the upload
  handler in `src/app/api/admin/media/route.ts` for an object-storage
  client (S3-compatible) — the `MediaAsset` model doesn't care where `url`
  points.
- **SQLite** is a single file — fine for one server instance, wrong for
  anything horizontally scaled or serverless (each instance/invocation
  would see a different disk). See [database.md](./database.md) for the
  PostgreSQL migration.
- **Scheduled jobs** need an external trigger — see
  [scheduled-jobs.md](./scheduled-jobs.md).
