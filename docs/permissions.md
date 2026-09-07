# Permissions & roles

`src/lib/auth/permissions.ts` defines the full permission catalog:

```
seo.view seo.edit seo.settings seo.redirects seo.audit seo.sitemap seo.analytics seo.indexing
pages.view pages.edit pages.publish
menus.view menus.edit
site.settings
blog.view blog.edit blog.publish blog.settings
ecommerce.view ecommerce.products ecommerce.inventory ecommerce.orders
  ecommerce.customers ecommerce.coupons ecommerce.reviews ecommerce.analytics ecommerce.settings
system.users system.settings system.activity system.media system.jobs
```

`menus.*` gates the menu builder (`/admin/menus`); `site.settings` gates
Reading Settings and the Header & Footer customizer (both structural,
site-wide surfaces, so kept at admin-level granularity like `seo.settings`)
— see [site-builder.md](./site-builder.md). `page_editor` also gets
`menus.*` (navigation and pages are closely coupled editorial work) and
`system.media` (so its holders can use the Image block's media-library
picker).

A `Role` (`prisma/schema.prisma`) stores its permission list as a JSON
string array. Seeded presets (`ROLE_PRESETS` in `permissions.ts`, applied by
`prisma/seed.ts`): `super_admin`, `administrator`, `seo_manager`,
`page_editor`, `blog_editor`, `commerce_manager`, `analyst`. New roles can be created from
`/admin/users` (permission editing for *custom* roles isn't in the UI yet —
today you can assign a user to any existing role, but authoring a new
permission set requires a database write; see
[scope-and-limitations.md](./scope-and-limitations.md)).

## Enforcement

Every admin page starts with:

```ts
await requirePermission("seo.edit"); // redirects to /admin/login or /admin?error=forbidden
```

Every admin API route starts with:

```ts
const session = await auth();
if (!session?.user || !hasPermission(session.user.permissions, "seo.edit")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

The admin sidebar (`src/lib/admin/nav.ts` + `AdminLayout`) filters nav items
by the current user's permissions server-side before ever rendering them —
a user without `ecommerce.view` doesn't just get a disabled link, the link
doesn't exist in the response at all.

**Never** rely on hiding a nav item as the only access control — every
route handler re-checks permissions independently, since a nav item being
hidden doesn't stop someone from requesting the URL/API route directly.
