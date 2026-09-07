/**
 * Resolves a MenuItem to a real href. Shared by the admin item-list preview
 * text and the public chrome renderer (src/lib/site/chrome-render.ts) so
 * both agree on what a menu item actually links to.
 */
export interface MenuItemLinkFields {
  linkType: string;
  url: string | null;
  targetId: string | null;
}

export interface MenuLinkLookups {
  pagesById: Map<string, { slug: string }>;
  postsById: Map<string, { slug: string }>;
  categoriesById: Map<string, { slug: string }>;
}

export function resolveMenuItemHref(item: MenuItemLinkFields, lookups: MenuLinkLookups): string {
  switch (item.linkType) {
    case "HOME":
      return "/";
    case "PAGE": {
      const page = item.targetId ? lookups.pagesById.get(item.targetId) : undefined;
      return page ? `/${page.slug}` : "#";
    }
    case "POST": {
      const post = item.targetId ? lookups.postsById.get(item.targetId) : undefined;
      return post ? `/blog/${post.slug}` : "#";
    }
    case "CATEGORY": {
      const category = item.targetId ? lookups.categoriesById.get(item.targetId) : undefined;
      return category ? `/blog/category/${category.slug}` : "#";
    }
    default:
      return item.url ?? "#";
  }
}
