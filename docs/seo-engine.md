# SEO engine

Everything under `src/lib/seo/` is designed so **one** implementation serves
every content type — pages, blog posts, products, categories, collections,
authors — rather than duplicating metadata/schema/scoring logic per type.

## The pieces

| File | Responsibility |
|---|---|
| `content-parser.ts` | Dependency-free HTML analysis (headings, images, links, paragraphs, plain text/word count) used by the rule engine. Deliberately not a full HTML parser/DOM — a pragmatic regex/state scan is enough for these signals and keeps a DOM library out of the server bundle. |
| `keyword.ts` | Focus-keyword heuristics: normalization, exact/simple-plural matching, occurrence counting, density, "in the first N% of content". Documented as heuristics, not ranking-factor claims (spec §13/§96). |
| `template.ts` | The **only** place `{title} {siteName} {sep} {category} {author} {date} {excerpt} {focusKeyword}` template variables get substituted (spec §7) — title/description templates in Global Settings and per-content-type settings both go through `renderTemplate()`. |
| `rules/catalog.ts` | Stable rule identifiers, weights, categories, default severities, and which content types each rule applies to. **Don't rename existing keys** — the bulk editor, dashboards, and any future CSV export key off them. |
| `rules/registry.ts` | `registerSeoRule()` / `getRegisteredRules()` — an open registry so a host app can add rules without touching the analyzer (spec §84). |
| `rules/builtin.ts` | ~30 rule implementations, each registered via the catalog metadata. |
| `scoring.ts` | `analyzeSeo(input, {overrides, thresholds})` — runs every registered rule applicable to `input.entityType`, skips (rather than penalizes) rules that don't apply or return `NOT_APPLICABLE`, and produces a 0-100 score + letter grade + per-category breakdown. |
| `resolver.ts` | `resolveSeo()` / `resolvePageMetadata()` — the priority chain: entity-level `SeoMetadata` → content-type defaults → global defaults → hard fallback (spec §52). `toNextMetadata()` converts the result into a Next.js `Metadata` object for `generateMetadata()`. |
| `schema/generators.ts` | `SchemaGenerator<T>` interface + `registerSchemaGenerator()`/`getSchemaGenerator()`. Organization, WebSite, WebPage, Article/BlogPosting, Product, BreadcrumbList, LocalBusiness, FAQPage, Person are registered. **Never fabricates `aggregateRating`** — it's only emitted when real review data is passed in. |
| `content-registry.ts` | `SeoContentAdapter` per entity type (`buildPath`, `getTitle`, `getSlug`, `getContentHtml`, `exists`) — this is what makes the SEO editor and analyzer entity-agnostic. |
| `services/content-seo.ts` | Ties the above together: `getSeoEditorData()` (what the editor UI reads), `saveSeoMetadata()` (validates, persists, recomputes score, writes an `ActivityLog` row, computes a `contentHash`), `bulkUpdateSeoFlags()` (safe bulk index/sitemap flag changes — deliberately no bulk title/description overwrite). |
| `services/duplicates.ts`, `services/links.ts`, `services/images.ts` | On-demand duplicate-metadata detection, internal-link/orphan analysis, and image-ALT scanning. Bounded (500 items) — see "Scaling this up" below. |
| `services/audit.ts` | Summarizes *already-computed* per-content analyses plus the three services above into a `SeoAuditRun`/`SeoAuditIssue` history, rather than re-running the full rule engine synchronously against everything. |
| `sitemap.ts` | Chunked sitemap generation, paginated per content type, respecting `sitemapInclude`/`robotsIndex` on `SeoMetadata` (defaults to included when no override exists). |
| `indexnow.ts` | Real IndexNow submission (an HTTP POST) — not a mock. Requires `INDEXNOW_KEY`; the verification file is served automatically by the catch-all route. |

## Adding a new content type

1. Add a `SeoContentAdapter` in `content-registry.ts` (five small functions).
2. Add a row to `SeoContentTypeSettings` (via the seed script or the
   Settings UI) with a `schemaTypeDefault` if one applies.
3. If it should appear in the sitemap, add a source to the `SOURCES` map in
   `sitemap.ts`.
4. Embed `<SeoEditorPanel entityType="yourType" entityId={id} />` on its
   admin edit page — that's the entire integration; the panel and its API
   route (`/api/admin/seo/content/[entityType]/[entityId]`) are already
   generic.

## Adding a new rule

Call `registerSeoRule({...})` (see `rules/builtin.ts` for the shape) from
any module loaded at startup, and add its metadata to
`rules/catalog.ts::DEFAULT_SEO_RULES` (or seed a `SeoRuleConfig` row
directly if you don't want it hardcoded). No changes to `scoring.ts` are
needed — it iterates whatever's registered.

## Configurable thresholds

`SeoThresholds` (title/description length bounds, paragraph length, keyword
density range, thin-content word count, minimum internal links, slug
length) has sensible defaults in `types/seo.ts::DEFAULT_THRESHOLDS`. They're
passed as an `analyzeSeo()` option — currently not yet exposed as their own
settings-UI page (see [scope-and-limitations.md](./scope-and-limitations.md)),
but the mechanism is there.

## Scaling this up (spec §56/§86: never audit synchronously at scale)

`services/links.ts` and `services/images.ts` are honest about their limits:
each scans up to 500 posts/pages/products **on demand**, in-process. That's
fine for a catalog in the hundreds; at 100k+ URLs it needs to become a
background job that persists its results (there's already a
`BackgroundJob` model and a `runBackgroundJob()` wrapper in
`src/lib/server/background-jobs.ts` to build that on) rather than a
page-load-time computation.
