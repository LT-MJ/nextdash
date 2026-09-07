# Database

Prisma + SQLite (`prisma/schema.prisma`, file at `DATABASE_URL=file:./dev.db`).
SQLite was chosen so the project runs with zero external services — clone,
`npm install`, `prisma db push`, done. It has two consequences worth
understanding before you deploy this for real:

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

## Switching to PostgreSQL

1. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to a `postgresql://` connection string.
3. Run `npx prisma migrate dev --name init` instead of `db push` from here
   on, so you get a real migration history.
4. Consider converting the JSON-string fields above to native `Json` columns
   (Postgres supports `Json`/`Jsonb` natively via Prisma) and the money
   fields to `Decimal(10,2)` — both require a data migration script, not
   just a schema edit, if you have existing rows.

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
