# Pages

Standalone site pages (About, Contact, Privacy Policy, etc.) — distinct
from blog posts (which have authors/categories/tags/scheduling) and from
products. Backed by the `Page` model, which existed in the schema from the
start (the SEO content-registry, sitemap, and bulk editor already had a
`page` content type wired up), but had no admin UI or public rendering
until now.

## Admin

- `/admin/pages` — list (title, status, SEO score, last updated).
- `/admin/pages/new` / `/admin/pages/[id]` — a two-tab editor: **Content**
  (title, slug — auto-suggested via `slugify()` but editable, status
  [DRAFT/PUBLISHED/ARCHIVED], and the same dependency-free HTML toolbar
  editor used by blog posts, `src/components/admin/ContentEditor.tsx` — it
  was moved out of `components/admin/blog/` since it's generic) and **SEO**
  (embeds the shared `<SeoEditorPanel entityType="page" .../>`, available
  after the first save).
- Publishing requires the `pages.publish` permission; editing (including
  saving an already-published page without changing its status) only needs
  `pages.edit`.
- Changing a **published** page's slug offers a dialog to create a 301
  redirect from the old path to the new one, via the existing
  `/api/admin/seo/redirects` endpoint — the same pattern blog posts use.
- Deleting a page also removes its `SeoMetadata` row (the polymorphic
  entityType/entityId link isn't a real foreign key, so nothing cascades
  automatically — the DELETE route does this explicitly).

## Permissions

New group: `pages.view`, `pages.edit`, `pages.publish`. `super_admin` and
`administrator` get these automatically (they already include every
permission). A new `page_editor` role preset exists for someone who should
only manage pages. `seo_manager` and `analyst` were also given `pages.view`
(the former also `pages.edit`) since they already touch page SEO.

## Public rendering — why it lives in the catch-all route, not a `page.tsx`

Pages are served at clean top-level URLs (`/about`, not `/pages/about`),
matching what the sitemap already promised (`path: \`/${slug}\`` in
`src/lib/seo/sitemap.ts`). A top-level single dynamic segment
(`app/[slug]/page.tsx`) sounds like the natural way to do this — except the
IndexNow key-verification file *also* has to live at a single top-level
segment (the protocol requires it at the domain root), and Next.js's App
Router won't let two differently-named single-dynamic-segment routes coexist
as siblings ("You cannot use different slug names for the same dynamic
path"). Rather than fight that, both are resolved by the same file:
`src/app/[...catchall]/route.ts` (a catch-all matches a single segment too),
checked in this order: sitemap chunk pattern → IndexNow key file → a
published `Page` with that slug → redirect lookup → logged 404.

Because that's a Route Handler, not a `page.tsx`, it can't render Next's
`generateMetadata()`/React tree — `src/lib/seo/services/page-renderer.ts`
builds the full HTML document by hand instead: `resolveSeo()` for
title/description/canonical/robots/OG/Twitter, `getSchemaGenerator()` for
WebPage + BreadcrumbList JSON-LD, and `renderJsonLdTags()`
(`src/lib/seo/json-ld.ts` — the same escaping logic the React `<JsonLd>`
component uses, factored out because Next.js refuses to let app code import
`react-dom/server`) to serialize it safely. The inline `<style>` block
copies the same CSS custom properties from `globals.css` so a Page still
looks like part of the site rather than a bare, unstyled document — full
Tailwind utility classes aren't available outside the real Next.js render
pipeline, so this stays deliberately simple (headings, paragraphs, links,
images) rather than trying to replicate the whole design system.

Only `PUBLISHED` pages render publicly; `DRAFT`/`ARCHIVED` ones 404 (and
get logged like any other unmatched URL, same as blog/product).

## Block editor

Pages can now be designed with an in-house, Gutenberg-style block editor
instead of raw HTML — see
[site-builder.md](./site-builder.md#block-editor-gutenberg-style-custom-in-house)
for the full writeup (data model, block types, and how public rendering
works from inside this same catch-all route).

## What this doesn't include

- No page templates/layouts (every page uses the same simple shell) or
  page hierarchy (no parent/child pages) — the `Page` model is intentionally
  flat, matching the spec's simplest case.
