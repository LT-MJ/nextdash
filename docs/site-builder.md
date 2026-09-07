# Site builder: block editor, menus, header/footer, reading settings

Four related features that let an admin design Pages visually and control
the site's overall structure without touching code.

## Block editor (Gutenberg-style, custom in-house)

`Page.contentFormat` (`"html" | "blocks"`) is a discriminator alongside the
original `Page.content` field. New pages default to `"blocks"`; the original
HTML-toolbar editor (`ContentEditor.tsx`) is still available via a "Switch to
HTML editor" toggle in the Content tab, and remains the escape hatch for
inline rich text (see below).

- **Data model**: `Page.blocks` is a JSON-stringified `Block[]`
  (`src/lib/pages/blocks/types.ts`), matching this project's existing
  convention of storing structured data as a stringified-JSON `String`
  column (`Product.specifications`, `SeoMetadata.schemaCustomJson`, etc.)
  rather than a native Postgres `Json` column.
- **Block types (v1)**: heading, paragraph, image, button, columns (2 or 3,
  each holding its own nested blocks — one level deep, no columns-in-columns),
  spacer, divider, quote, and a **Custom HTML** block that wraps the existing
  `ContentEditor` — the deliberate escape hatch for inline bold/italic/links
  mid-paragraph, which v1's plain-text block fields don't support.
- **Editor UI** (`src/components/admin/pages/blocks/`): `BlockEditor` (drag
  reorder via `@dnd-kit`, plus move-up/down/duplicate/delete buttons so
  reordering stays keyboard-accessible), `BlockInserter` (grouped "+ Add
  block" menu), and one editor component per block type under `editors/`.
- **Validation** (`src/lib/pages/blocks/schema.ts`): a Zod
  `discriminatedUnion` mirrors the TS types; every URL field is checked with
  `isSafeUrl()` (`src/lib/pages/blocks/url-safety.ts`, an allowlist of
  relative/`#`/`http(s)`/`mailto`/`tel`), rejecting `javascript:`/`data:`/etc.
  both at save time and again in the renderer.
- **Public rendering — the reason this exists as a separate module at all**:
  Pages render publicly from a Route Handler
  (`src/app/[...catchall]/route.ts`), not a `page.tsx` — see
  [pages.md](./pages.md) for why — and Route Handlers can't import
  `react-dom/server`. So blocks are rendered to an HTML string
  (`src/lib/pages/blocks/render.ts`, one `render*Block()` function per
  type), the same pattern already used for JSON-LD
  (`src/lib/seo/json-ld.ts`). Every plain-text/URL field is escaped via the
  shared `src/lib/html/escape.ts` helpers; `customHtml` is the one
  deliberately unescaped block (same trust model as the original
  whole-page `content` field: an authenticated `pages.edit` admin is
  already trusted with raw HTML).
- **SEO analysis**: `src/lib/seo/content-registry.ts`'s `"page"` adapter
  also branches on `contentFormat`, rendering blocks to the same HTML string
  before handing it to the SEO content-parser — so word count, heading
  structure, image-alt auditing, etc. all keep working unchanged for
  block-based pages.
- **Known limitation**: because of the Route-Handler constraint above, there
  are two independent renderers to keep in sync — a React tree for the
  editor canvas, and the string renderer for the public page — both driven
  by the same `types.ts`/`schema.ts`/`registry.ts` definitions. If Pages
  ever move to a real `app/[slug]/page.tsx` (solving the IndexNow-key/
  routing conflict some other way), the block editor's data model could
  drive a single React-based renderer instead.

## Reading Settings: homepage & blog-page assignment

`ReadingSettings` (singleton, `src/lib/site/settings.ts`) lets an admin
assign a **published** `Page` as:

- **Homepage** (`homepageMode: "PAGE"` + `homepagePageId`) — fully replaces
  `src/app/page.tsx`'s hardcoded hero with that Page's content (title +
  block/HTML content via the shared `<PageContent>` component). The Page
  stays reachable at its own `/${slug}` too — the same duplicate-URL
  behavior WordPress has for a static front page.
- **Blog page** (`blogPageId`) — only replaces `/blog`'s intro heading/text;
  the post grid, search, and category chips stay fully dynamic, matching
  WordPress's real "posts page" semantics (which doesn't override the
  archive listing either).

Both `src/app/page.tsx` and `src/app/blog/layout.tsx`'s tree are
`force-dynamic` — see "Why chrome-bearing routes are dynamic" below.

## Menus

`Menu`/`MenuItem` (self-referential `parentId`, like `BlogCategory`) back a
simple two-level nav builder at `/admin/menus`. Items link to a custom URL,
or internally to a Page/BlogPost/BlogCategory (`resolveMenuItemHref()` in
`src/lib/menus/resolve.ts` turns a link definition into a real href, shared
by the admin preview and the public chrome renderer). Sibling reordering
uses `@dnd-kit/sortable` with a drag handle plus up/down buttons;
re-parenting is an explicit "Nest under…" picker rather than drag-to-indent
— simpler to implement correctly and more accessible, at the cost of one
less "WordPress classic menu" affordance.

## Header & Footer customizer (structured settings, not a block builder)

`HeaderFooterSettings` (singleton) captures logo (image or text), a header
layout variant, a sticky-header toggle, a picked primary `Menu`, up to 6
footer columns (each either a picked `Menu` or freeform links), social
links, and a copyright template supporting `{year}`/`{siteName}`. This is
deliberately a fixed set of fields, not a freeform block builder — a
simpler surface for a part of the site every page shares.

### The shared chrome layer

Before this feature, there was **no shared header/footer** anywhere — the
homepage had none at all, and blog/shop/CMS-Pages each hardcoded their own.
`src/lib/site/chrome-render.ts` is the single source of truth now:
`resolveSiteChrome()` loads settings + the assigned menu(s) into a plain
`ResolvedChrome` object, consumed two ways — `<SiteHeader>`/`<SiteFooter>`
(`src/components/site/`, React Server Components used by the homepage,
`blog/layout.tsx`, and `StorefrontChrome`) and `renderHeaderHtml()`/
`renderFooterHtml()` (plain HTML strings, used by the CMS-Page string
renderer) — the same "one resolver, two render targets" pattern as the
block editor above.

### Why chrome-bearing routes are dynamic

`<SiteHeader>`/`<SiteFooter>` read live, admin-editable settings on every
render. Next.js only marks a route dynamic automatically when it uses an
explicitly-dynamic API (`cookies()`, `headers()`, `searchParams`, etc.) —
plain Prisma reads don't count, so a route with no other dynamic dependency
(the homepage; `/cart`; `/shop/checkout`) would otherwise get statically
prerendered once at build time and never reflect a later settings change.
`src/app/page.tsx`, `src/app/blog/layout.tsx`, and the four
`StorefrontChrome`-wrapping layouts (`shop`, `cart`, `category`,
`collections`) all set `export const dynamic = "force-dynamic"` for this
reason. The CMS-Page catch-all route needs no such marker — Route Handlers
are dynamic by default unless explicitly opted into static caching.
