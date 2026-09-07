import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PRESETS } from "../src/lib/auth/permissions";
import { DEFAULT_SEO_RULES } from "../src/lib/seo/rules/catalog";
import { analyzeContentSeo } from "../src/lib/seo/services/content-seo";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding roles...");
  const roleIds: Record<string, string> = {};
  for (const [key, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: preset.name, description: preset.description, permissions: JSON.stringify(preset.permissions) },
      create: {
        key,
        name: preset.name,
        description: preset.description,
        permissions: JSON.stringify(preset.permissions),
        isSystem: true,
      },
    });
    roleIds[key] = role.id;
  }

  console.log("Seeding default admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Site Administrator",
      email: adminEmail,
      passwordHash,
      roleId: roleIds.super_admin,
    },
  });

  console.log("Seeding SEO global settings...");
  await prisma.seoGlobalSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Nextdash",
      siteUrl: process.env.SITE_URL || "http://localhost:3000",
      orgType: "Organization",
      orgName: "Nextdash",
    },
  });

  await prisma.sitemapSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      contentTypeToggles: JSON.stringify({ page: true, post: true, product: true, category: true, collection: true }),
    },
  });

  await prisma.robotsTxtSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.breadcrumbSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.localSeoSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  console.log("Seeding SEO content type settings...");
  const contentTypes: Array<{ contentType: string; label: string; schemaTypeDefault: string }> = [
    { contentType: "page", label: "Pages", schemaTypeDefault: "WebPage" },
    { contentType: "post", label: "Blog Posts", schemaTypeDefault: "BlogPosting" },
    { contentType: "product", label: "Products", schemaTypeDefault: "Product" },
    { contentType: "category", label: "Blog Categories", schemaTypeDefault: "CollectionPage" },
    { contentType: "product_category", label: "Product Categories", schemaTypeDefault: "CollectionPage" },
    { contentType: "collection", label: "Collections", schemaTypeDefault: "CollectionPage" },
    { contentType: "author", label: "Authors", schemaTypeDefault: "ProfilePage" },
    { contentType: "homepage", label: "Homepage", schemaTypeDefault: "WebPage" },
  ];
  for (const ct of contentTypes) {
    await prisma.seoContentTypeSettings.upsert({
      where: { contentType: ct.contentType },
      update: {},
      create: ct,
    });
  }

  console.log("Seeding SEO rule catalog...");
  for (const rule of DEFAULT_SEO_RULES) {
    await prisma.seoRuleConfig.upsert({
      where: { key: rule.key },
      update: {},
      create: {
        key: rule.key,
        name: rule.name,
        category: rule.category,
        weight: rule.weight,
        severity: rule.defaultSeverity,
        contentTypes: rule.contentTypes ? JSON.stringify(rule.contentTypes) : null,
      },
    });
  }

  console.log("Seeding a sample blog author, category, tag, post...");
  const author = await prisma.blogAuthor.upsert({
    where: { slug: "site-editorial" },
    update: {},
    create: { slug: "site-editorial", name: "Editorial Team", bio: "The Nextdash editorial team." },
  });
  const category = await prisma.blogCategory.upsert({
    where: { slug: "announcements" },
    update: {},
    create: { slug: "announcements", name: "Announcements" },
  });
  const tag = await prisma.blogTag.upsert({
    where: { slug: "getting-started" },
    update: {},
    create: { slug: "getting-started", name: "Getting Started" },
  });
  const post = await prisma.blogPost.upsert({
    where: { slug: "welcome-to-nextdash" },
    update: {},
    create: {
      slug: "welcome-to-nextdash",
      title: "Welcome to Nextdash",
      excerpt: "An introduction to the unified SEO, content, and commerce platform.",
      content: "<p>This is the first post published through the Nextdash blog CMS.</p>",
      authorId: author.id,
      categoryId: category.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      readingTimeMinutes: 2,
      tags: { create: [{ tagId: tag.id }] },
    },
  });

  await prisma.seoMetadata.upsert({
    where: { entityType_entityId: { entityType: "post", entityId: post.id } },
    update: {},
    create: {
      entityType: "post",
      entityId: post.id,
      title: "Welcome to Nextdash — Unified SEO, Blog & Commerce",
      description: "An introduction to the unified SEO, content, and commerce platform built on Next.js.",
      focusKeyword: "nextdash",
    },
  });

  console.log("Seeding a sample product category + product...");
  const productCategory = await prisma.productCategory.upsert({
    where: { slug: "featured" },
    update: {},
    create: { slug: "featured", name: "Featured" },
  });
  const product = await prisma.product.upsert({
    where: { slug: "sample-product" },
    update: {},
    create: {
      slug: "sample-product",
      name: "Sample Product",
      description: "A demo product seeded to exercise the commerce catalog and SEO integration.",
      shortDescription: "A demo product.",
      sku: "SAMPLE-001",
      status: "ACTIVE",
      price: 49.0,
      categoryId: productCategory.id,
      inventory: { create: [{ sku: "SAMPLE-001", stock: 25, reorderThreshold: 5 }] },
    },
  });

  await prisma.seoMetadata.upsert({
    where: { entityType_entityId: { entityType: "product", entityId: product.id } },
    update: {},
    create: {
      entityType: "product",
      entityId: product.id,
      title: "Sample Product — Buy Online",
      description: "A demo product seeded to exercise the commerce catalog and SEO integration.",
      focusKeyword: "sample product",
    },
  });

  console.log("Computing initial SEO analysis for seeded content...");
  for (const [entityType, entityId] of [
    ["post", post.id],
    ["product", product.id],
  ] as const) {
    const analysis = await analyzeContentSeo(entityType, entityId);
    await prisma.seoMetadata.update({
      where: { entityType_entityId: { entityType, entityId } },
      data: {
        seoScore: analysis.score,
        seoGrade: analysis.grade,
        seoScoreBreakdown: JSON.stringify(analysis.results),
        analyzedAt: new Date(),
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
