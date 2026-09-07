# Nextdash documentation

Nextdash is a unified SEO management platform, blog CMS, and e-commerce
management system built on Next.js 15 (App Router), TypeScript, Prisma, and
NextAuth (Auth.js v5).

This repository started empty — there was no pre-existing Next.js site to
extend, so the entire stack below was built from scratch rather than layered
onto existing conventions.

## Contents

- [Installation & environment](./installation.md)
- [Architecture overview](./architecture.md)
- [Database](./database.md)
- [SEO engine](./seo-engine.md)
- [Permissions & roles](./permissions.md)
- [Scheduled jobs](./scheduled-jobs.md)
- [Pages](./pages.md)
- [Blog CMS](./blog.md)
- [E-commerce](./ecommerce.md)
- [Security](./security.md)
- [Scope & known limitations](./scope-and-limitations.md)

## Quick start

```bash
npm install
cp .env.example .env   # edit DATABASE_URL / AUTH_SECRET / SITE_URL as needed
npx prisma generate
npx prisma db push
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='ChangeMe123!' npx tsx prisma/seed.ts
npm run dev
```

Log in at `/admin/login` with the email/password you passed to the seed
script (defaults to `admin@example.com` / `ChangeMe123!` if you don't set
those env vars).

## Verifying the build

```bash
npx tsc --noEmit   # typecheck
npm run lint       # ESLint (also runs during `next build`)
npm run test       # Vitest unit tests
npm run build      # production build
npx playwright test  # E2E smoke tests (starts its own server on :3100)
```
