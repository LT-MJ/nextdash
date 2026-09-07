# Database

Production runs on **PostgreSQL via Supabase** (`prisma/schema.prisma`,
`DATABASE_URL` set to the pooled connection string, `DIRECT_URL` to the
direct one for migrations — see `.env.example`). Local development can
still point `DATABASE_URL` at a `file:./dev.db` SQLite file by switching
the schema's `provider` back to `"sqlite"` and dropping `directUrl`, if you
want a zero-external-services setup; the two consequences below predate
the Postgres switch and no longer apply once you're on Postgres, but are
kept here as history/context for anyone using the SQLite path:

## JSON-array-like fields are `String?`, not native arrays

SQLite has no array column type, so anything conceptually list-shaped
(`SeoMetadata.additionalKeywords`, `BlogPost.gallery`, `Product.images`,
`ProductVariant.options`, `Order.shippingAddress`, `Coupon.productRestrictions`,
etc.) is a `String?` holding `JSON.stringify(...)`. Always
`JSON.parse(field ?? "[]")` / `JSON.parse(field ?? "{}")` when reading and
`JSON.stringify(...)` when writing — every service function in
`src/lib/seo/services/*` and the blog/commerce equivalents follows this
convention. If you migrate to PostgreSQL, these could become native
`String[]`/`Json` columns instead, but that's a schema change + data
migration, not a drop-in.

## Money fields are `Float`, not `Decimal`

Prisma's SQLite connector doesn't reliably support `Decimal`. Every price
field (`Product.price`, `Order.total`, etc.) is `Float`. This is fine for a
demo/small catalog but is the wrong choice for production money math —
floating-point rounding errors compound. **Before going to production,
migrate these to `Decimal(10,2)` under PostgreSQL** and re-run all order/
coupon/tax arithmetic through decimal-safe operations.

## Migrations

Schema changes go through `prisma migrate dev --name <description>` (creates
a migration file under `prisma/migrations/` and applies it) locally, and
`npm run db:migrate:deploy` (`prisma migrate deploy`) in CI/production —
never `db:push` against the Supabase database, so migration history stays
intact. Consider converting the JSON-string fields above to native `Json`
columns (Postgres supports `Json`/`Jsonb` natively via Prisma) and the money
fields to `Decimal(10,2)` — both require a data migration script, not just a
schema edit, since there are existing rows.

## Models at a glance

- **Auth/RBAC**: `Role` (permissions stored as a JSON string array),
  `User`.
- **SEO core**: `SeoMetadata` (polymorphic — one row per
  `(entityType, entityId)`, unique-constrained), `SeoRuleConfig`,
  `SeoContentTypeSettings`, `SeoGlobalSettings`, `LocalSeoSettings`,
  `SitemapSettings`, `RobotsTxtSettings`, `BreadcrumbSettings`, `Redirect`,
  `NotFoundLog`, `IndexingQueueItem`, `SeoAuditRun` / `SeoAuditIssue`.
- **Content**: `Page`; `BlogPost`/`BlogCategory`/`BlogTag`/`BlogAuthor`/
  `BlogPostRevision`/`BlogComment`/`BlogPostRelation`.
- **Commerce**: `Product`/`ProductVariant`/`ProductCategory`/`Collection`/
  `InventoryItem`/`InventoryAdjustment`/`Customer`/`Coupon`/`Order`/
  `OrderItem`/`Review`.
- **Cross-cutting**: `MediaAsset`, `ActivityLog`, `BackgroundJob`.

Adding a new SEO-enabled content type does **not** require a schema change —
`SeoMetadata.entityType` is just a string key. What it does require is a
content adapter (see [seo-engine.md](./seo-engine.md#adding-a-new-content-type)).

## Seeding

`prisma/seed.ts` creates the role catalog, a super-admin user (email/password
from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, defaulting to
`admin@example.com` / `ChangeMe123!`), default settings rows, the SEO rule
catalog, and one sample blog post + one sample product so every admin list
page has something real to render on first run.
