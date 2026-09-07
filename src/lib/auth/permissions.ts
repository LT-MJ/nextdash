export const PERMISSIONS = {
  seo: ["seo.view", "seo.edit", "seo.settings", "seo.redirects", "seo.audit", "seo.sitemap", "seo.analytics", "seo.indexing"],
  blog: ["blog.view", "blog.edit", "blog.publish", "blog.settings"],
  ecommerce: [
    "ecommerce.view",
    "ecommerce.products",
    "ecommerce.inventory",
    "ecommerce.orders",
    "ecommerce.customers",
    "ecommerce.coupons",
    "ecommerce.reviews",
    "ecommerce.analytics",
    "ecommerce.settings",
  ],
  system: ["system.users", "system.settings", "system.activity", "system.media", "system.jobs"],
} as const;

export type PermissionGroup = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionGroup][number];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS).flat();

export const ROLE_PRESETS: Record<string, { name: string; description: string; permissions: Permission[] }> = {
  super_admin: {
    name: "Super Admin",
    description: "Full access to every module.",
    permissions: ALL_PERMISSIONS,
  },
  administrator: {
    name: "Administrator",
    description: "Full operational access, excluding system-level user management.",
    permissions: ALL_PERMISSIONS.filter((p) => p !== "system.users"),
  },
  seo_manager: {
    name: "SEO Manager",
    description: "Manages all SEO configuration, audits, and content SEO.",
    permissions: [...PERMISSIONS.seo, "blog.view", "ecommerce.view"],
  },
  blog_editor: {
    name: "Blog Editor",
    description: "Creates and publishes blog content, including its SEO panel.",
    permissions: [...PERMISSIONS.blog, "seo.view", "seo.edit"],
  },
  commerce_manager: {
    name: "Commerce Manager",
    description: "Manages products, orders, customers, and commerce SEO.",
    permissions: [...PERMISSIONS.ecommerce, "seo.view", "seo.edit"],
  },
  analyst: {
    name: "Analyst",
    description: "Read-only access to analytics and reporting across modules.",
    permissions: ["seo.view", "seo.analytics", "blog.view", "ecommerce.view", "ecommerce.analytics"],
  },
};

export function hasPermission(userPermissions: string[], required: Permission | Permission[]): boolean {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(userPermissions: string[], required: Permission[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}
