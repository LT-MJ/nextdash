# Scope & known limitations

The master prompt this build responds to specifies an extremely large
surface area (183 numbered sections). This document is the honest
inventory: what's actually implemented and working, what's a deliberate
simplification with a documented reason, and what simply isn't built yet.
Nothing below is a fake/mocked integration presented as real — where a
real external service would be needed and isn't configured, the UI says so
explicitly (e.g. the Analytics page) rather than fabricating data.

## Fully implemented and verified

- Auth/RBAC, the full SEO engine (rule-based scoring, metadata resolver,
  schema generators, sitemap/robots/redirects/404 monitor, IndexNow,
  duplicate-metadata detection, site audit, internal-link/orphan analysis,
  image-ALT scanning, bulk editor), Pages (admin CRUD + public rendering
  with real title/description/canonical/OG/Twitter/JSON-LD, slug-change
  redirects — see [pages.md](./pages.md)), Blog CMS (admin + public, revisions,
  slug-change redirects), E-commerce (admin + public storefront, real
  transactional checkout with server-side price/stock/coupon
  revalidation, an enforced order state machine), media library, user/role
  management, activity log, a scheduled-maintenance endpoint + jobs
  dashboard, global admin search, unit tests for the SEO engine, and
  Playwright smoke tests.
- Verified via a real production build, real login, and real end-to-end
  checkout against the seeded database — not just `tsc --noEmit`. That
  process caught two genuine bugs (see the commit history / architecture
  doc) that a types-only check missed.

## Deliberately simplified (with a documented reason)

- **Payments**: no gateway configured in this environment. Checkout is an
  honest manual/invoice-style flow — see [ecommerce.md](./ecommerce.md).
- **Shipping & tax**: flat-rate placeholders, not a carrier/tax-jurisdiction
  integration — see [ecommerce.md](./ecommerce.md).
- **Money representation**: `Float`, not `Decimal` — a SQLite/Prisma
  constraint, see [database.md](./database.md).
- **Google Search Console / Google Analytics**: the Analytics pages (both
  SEO and Commerce) show an honest "not connected" state with the exact
  env vars and next steps needed, rather than fabricated numbers.
- **Rich text editing**: the blog post and Page content editors share a
  dependency-free HTML-tag-wrapping toolbar over a textarea
  (`src/components/admin/ContentEditor.tsx`), not a full WYSIWYG library —
  a deliberate choice to avoid adding a heavy editor dependency for this
  build; swapping in TipTap/Lexical/etc. later is a contained change to
  that one component.
- **Pages have no hierarchy or templates**: the `Page` model is
  intentionally flat (no parent/child pages, no selectable layout) —
  every published page renders through the same simple shell. See
  [pages.md](./pages.md) for why public rendering lives in the catch-all
  route rather than a `page.tsx`.
- **Media storage**: uploads write to local disk (`public/uploads/`) via
  `node:fs` — real and working for a traditional server, but wrong for
  serverless deployment (ephemeral filesystem). See
  [installation.md](./installation.md#deployment-notes).

## Not built (spec sections this build does not cover)

- **Google Search Console / GA API clients** themselves (the settings
  plumbing and empty states exist; the actual OAuth flow and Data API
  calls do not).
- **Custom role authoring UI** — you can assign a user to any existing
  role from `/admin/users`, but there's no UI to define a new permission
  set; that requires a direct database write (`Role.permissions` is a JSON
  string array).
- **Configurable SEO thresholds UI** — `SeoThresholds` (title/description
  length, keyword density range, thin-content word count, etc.) has
  sensible defaults and the scoring engine accepts overrides, but there's
  no settings page to edit them yet.
- **External broken-link checker** — the internal-link/orphan analysis
  (`/admin/seo/links`) is real and on-demand; there is no scheduled job
  that fetches external URLs found in content to check their HTTP status.
- **CSV import/export** for SEO metadata or redirects (spec §46/§88).
- **llms.txt / AI-visibility module** (spec §81) — the `hasContentAI` rule
  exists as a reserved, honestly-labeled no-op extension point; nothing
  else was built here.
- **Blog**: no `BlogPost.gallery` UI (only the featured image), no admin UI
  to hand-curate related-post relationships, no comment-moderation UI
  (the `BlogComment` model and the post-level `commentsEnabled` toggle
  exist; there's no submission form or moderation queue).
- **Commerce**: no public review-submission form (moderation queue is
  fully functional for admin/seed-created reviews), no multi-warehouse /
  multi-location inventory (one stock number per `InventoryItem`), no
  multi-currency support.
- **Distributed rate limiting** and **CSRF tokens beyond `SameSite=Lax`
  cookies** — see [security.md](./security.md#known-gaps-be-aware-of-these-before-a-real-production-deployment).
- **Historical audit trend/diff view** — `/admin/seo/audit` shows each run's
  issue list; it doesn't yet diff one run against the previous one.

## A note on how this was built

The repository was completely empty when this work started — there was no
existing Next.js codebase to inspect or extend, contrary to what the master
prompt assumed. Given the scope (SEO platform + Blog CMS + E-commerce, ~183
spec sections), this was built as a genuine, working core of every major
area rather than a shallow scaffold of all of them — the list above is
meant to make the boundary between those two honest and easy to find.
