# Architecture overview

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router | Server Components for data-heavy admin pages, Route Handlers for APIs, native `generateMetadata()` for SEO |
| Language | TypeScript, strict mode | Everything below is typed end to end |
| Database | SQLite via Prisma, `prisma/schema.prisma` | Zero-config local dev; see [database.md](./database.md) for the PostgreSQL migration path |
| Auth | NextAuth (Auth.js) v5, Credentials provider, JWT sessions | No OAuth requirement was given; JWT sessions avoid needing an `Account`/`Session` table |
| Styling | Tailwind CSS + hand-rolled component primitives (some Radix UI under the hood: Dialog, Tabs, Select, Switch, Checkbox, Tooltip, Dropdown) | Radix gives accessible primitives (focus trapping, ARIA) without a full component-library dependency |
| Charts | Recharts | Already a common choice for Next.js dashboards; no server dependency |
| Data fetching (client) | SWR | Lightweight, used consistently in every "use client" admin panel that talks to its own API route |
| Validation | Zod | Every API route validates its body server-side, regardless of what client-side forms already checked |

## Directory layout

```
src/
  app/
    admin/
      login/                    # public — outside the (dashboard) route group
      (dashboard)/               # route group: shares layout.tsx, which enforces auth
        seo/...                  # SEO admin
        blog/...                 # Blog CMS admin
        ecommerce/...            # Commerce admin
        pages/...                # Pages admin (CRUD + block editor)
        menus/...                # menu builder
        site/                    # Reading Settings, Header & Footer customizer
        users/ activity/ media/ jobs/
    api/
      auth/[...nextauth]/        # NextAuth route handlers
      admin/...                  # authenticated admin API routes (mirrors the admin/ page tree)
      shop/...                   # public-facing cart/checkout API
      cron/                      # scheduled-maintenance endpoint (bearer-token gated)
    [...catchall]/route.ts       # redirects, 404 logging, sitemap chunks, IndexNow key file, Page rendering
    robots.txt/route.ts
    sitemap.xml/route.ts
    page.tsx                     # public homepage (Reading Settings can swap this for a Page)
    blog/...  shop/...  category/...  collections/...  cart/...   # public site
  components/
    ui/          # design-system primitives (Button, Card, Table, Dialog, Tabs, Select, Switch, ...)
    admin/       # shared admin chrome (sidebar, topbar, command palette, stat cards, status badges)
      pages/blocks/  # the block editor (BlockEditor, per-type editors) — see site-builder.md
      menus/         # the menu builder's item tree + add/edit dialog
      site/          # Reading Settings + Header & Footer settings forms
    seo/         # SEO editor, score visualization, search/social previews, JSON-LD renderer
    site/        # <SiteHeader>/<SiteFooter> — the shared public chrome, see site-builder.md
    content/     # <PageContent> — renders a Page's content inside a real React tree
  lib/
    auth/        # NextAuth config (split edge/full — see below), permissions, guards
    seo/         # the SEO engine — see seo-engine.md
    pages/       # Pages validation + the block editor's data model (blocks/)
    menus/       # menu validation + link resolution
    site/        # Reading Settings / Header & Footer settings + the chrome resolver/renderer
    html/        # shared escapeHtml/escapeAttr for every hand-built HTML string
    blog/        # blog-specific server logic (reading time, related posts)
    ecommerce/   # commerce-specific server logic (pricing, inventory, coupons, order state machine)
    server/      # Prisma client singleton, background-job wrapper
  middleware.ts  # Edge-runtime auth gate for /admin/*
prisma/
  schema.prisma
  seed.ts
docs/
tests/
  unit/          # Vitest — pure logic (SEO engine)
  e2e/           # Playwright — smoke tests against a running build
```

## Server vs. Client Components

Every page under `app/admin/**` is a Server Component by default and fetches
its own data directly via Prisma (`import { db } from "@/lib/server/db"`).
Interactivity (forms with local state, tabs, dialogs, the rich-text-ish post
editor, the cart) lives in `"use client"` components that talk back to a
same-origin API route with `fetch`/SWR.

**A recurring gotcha discovered while building this**: a Server Component
cannot pass a *component reference* (e.g. a `lucide-react` icon) as a prop
into a Client Component — React Server Components can only serialize plain
data and already-rendered elements across that boundary. Whenever the admin
sidebar needed per-item icons, the fix was to render the icon to a JSX
element in the Server Component and hand the Client Component that
`ReactNode`, not the icon component itself (see
`src/app/admin/(dashboard)/layout.tsx` next to `AdminSidebar`).

## Auth: the edge/Node split

NextAuth's `auth()` wrapper is used as `middleware.ts`, which by default
runs on the Edge runtime — no Node.js APIs, no Prisma, no `bcryptjs` (which
needs Node's `crypto`). But the full auth config's Credentials provider
needs both, to look up the user and compare the password hash.

The fix (a documented NextAuth v5 pattern): `src/lib/auth/edge-config.ts`
holds the provider-less, DB-free config used only by `middleware.ts`.
`src/lib/auth/config.ts` spreads that and adds the real Credentials
provider; it's imported only by `src/lib/auth/index.ts` (used in Server
Components and Route Handlers, which run on the Node.js runtime). Get this
wrong and `next build` fails with "A Node.js module is loaded... which is
not supported in the Edge Runtime."

A related consequence: the login page **must not** live under the same
route-group layout that enforces authentication, or you get an infinite
redirect loop (the layout redirects an unauthenticated visitor to
`/admin/login`, which — if it shared that layout — would redirect again).
That's why `app/admin/login/page.tsx` sits outside the `app/admin/(dashboard)/`
route group: the group's `layout.tsx` is the only thing that calls
`requireAuth()`.

## Redirects, 404s, Pages, and sitemap chunks: why one catch-all route

The public technical-SEO surfaces (redirect resolution with a specific HTTP
status 301/302/303/307/308, 404 logging, chunked sitemap files named
`sitemap-{type}-{n}.xml`, the IndexNow key-verification file) all need
Prisma — so none of them can live in Edge middleware. And App Router dynamic
segments must be *entirely* dynamic (`[slug]`), not a mix of static text and
a bracketed param in one folder name — so a chunked sitemap filename like
`sitemap-post-1.xml` can't be expressed as its own route file.

Standalone CMS Pages (spec's "Pages" content type — see
[pages.md](./pages.md)) get pulled into this same file for a related reason:
they want clean top-level URLs (`/about`, matching what the sitemap already
promises), which puts them at the same single-segment routing position as
the IndexNow key file. Next.js won't let two differently-named single
dynamic segments (`[slug]` for pages, something else for the key file)
coexist as siblings, so both have to be resolved by the same route.

The solution is `src/app/[...catchall]/route.ts`: a single catch-all Route
Handler (Node.js runtime by default) that only ever runs for a request that
didn't match anything more specific. It checks, in order: does the last path
segment look like `sitemap-{type}-{n}.xml`? Does it match the configured
IndexNow key file? Is there a published Page at this slug? Is there a
redirect for this exact path (or a regex-mode one)? If none of those, log
the miss to `NotFoundLog` and return a 404. Since a Route Handler can't
render a `page.tsx`'s React tree, Page rendering builds its HTML by hand
(`src/lib/seo/services/page-renderer.ts`) — see pages.md for how that stays
consistent with `resolveSeo()`/JSON-LD/styling instead of duplicating logic.
`/robots.txt` and `/sitemap.xml` themselves are separate, fully-static route
folders (`app/robots.txt/route.ts`, `app/sitemap.xml/route.ts`) — Next.js
always prefers a more specific static match over the catch-all, so there's
no ordering ambiguity.

## What's genuinely implemented vs. what's an honest stub

See [scope-and-limitations.md](./scope-and-limitations.md) for the full
list. In short: there is no fake payment gateway, no fake Google Search
Console data, and no fabricated product ratings — where a real integration
would need credentials this build doesn't have, the UI says so explicitly
(e.g. the Analytics page) rather than pretending.
