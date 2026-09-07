import { cache } from "react";
import { db } from "@/lib/server/db";
import { escapeHtml, escapeAttr } from "@/lib/html/escape";
import { getHeaderFooterSettings } from "./settings";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { parseFooterColumns, parseSocialLinks } from "./types";
import { resolveMenuItemHref, type MenuLinkLookups } from "@/lib/menus/resolve";

/**
 * Framework-agnostic site chrome resolver + string renderer — the
 * header/footer analogue of src/lib/seo/json-ld.ts. `resolveSiteChrome()`
 * is consumed by the React <SiteHeader>/<SiteFooter> components AND by
 * src/lib/seo/services/page-renderer.ts's string-based renderer (CMS Pages
 * are served from a Route Handler that can't render React — see
 * docs/pages.md), via renderHeaderHtml()/renderFooterHtml().
 */

export interface ResolvedMenuNode {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: ResolvedMenuNode[];
}

export interface ResolvedFooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface ResolvedChrome {
  logo: { imageUrl: string | null; altText: string | null; text: string | null };
  siteName: string;
  headerLayout: string;
  headerSticky: boolean;
  primaryMenu: ResolvedMenuNode[];
  footerColumns: ResolvedFooterColumn[];
  socialLinks: { platform: string; url: string }[];
  copyrightText: string;
}

async function buildLookups(targetIds: { page: Set<string>; post: Set<string>; category: Set<string> }): Promise<MenuLinkLookups> {
  const [pages, posts, categories] = await Promise.all([
    targetIds.page.size > 0 ? db.page.findMany({ where: { id: { in: [...targetIds.page] } }, select: { id: true, slug: true } }) : [],
    targetIds.post.size > 0 ? db.blogPost.findMany({ where: { id: { in: [...targetIds.post] } }, select: { id: true, slug: true } }) : [],
    targetIds.category.size > 0 ? db.blogCategory.findMany({ where: { id: { in: [...targetIds.category] } }, select: { id: true, slug: true } }) : [],
  ]);
  return {
    pagesById: new Map(pages.map((p) => [p.id, { slug: p.slug }])),
    postsById: new Map(posts.map((p) => [p.id, { slug: p.slug }])),
    categoriesById: new Map(categories.map((c) => [c.id, { slug: c.slug }])),
  };
}

function collectTargetIds(items: { linkType: string; targetId: string | null }[], into: { page: Set<string>; post: Set<string>; category: Set<string> }) {
  for (const item of items) {
    if (!item.targetId) continue;
    if (item.linkType === "PAGE") into.page.add(item.targetId);
    else if (item.linkType === "POST") into.post.add(item.targetId);
    else if (item.linkType === "CATEGORY") into.category.add(item.targetId);
  }
}

function buildMenuTree(items: { id: string; parentId: string | null; label: string; linkType: string; url: string | null; targetId: string | null; openInNewTab: boolean; order: number }[], lookups: MenuLinkLookups): ResolvedMenuNode[] {
  const byParent = new Map<string | null, typeof items>();
  for (const item of items) {
    const key = item.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  function build(parentId: string | null): ResolvedMenuNode[] {
    return (byParent.get(parentId) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id,
        label: item.label,
        href: resolveMenuItemHref(item, lookups),
        openInNewTab: item.openInNewTab,
        children: build(item.id),
      }));
  }
  return build(null);
}

export const resolveSiteChrome = cache(async (): Promise<ResolvedChrome> => {
  const [settings, globalSettings] = await Promise.all([getHeaderFooterSettings(), getGlobalSeoSettings()]);
  const footerColumnDefs = parseFooterColumns(settings.footerColumns);
  const socialLinks = parseSocialLinks(settings.socialLinks);

  const menuIds = new Set<string>();
  if (settings.primaryMenuId) menuIds.add(settings.primaryMenuId);
  for (const col of footerColumnDefs) if (col.menuId) menuIds.add(col.menuId);

  const menuItemsByMenu = new Map<string, Awaited<ReturnType<typeof db.menuItem.findMany>>>();
  if (menuIds.size > 0) {
    const allItems = await db.menuItem.findMany({ where: { menuId: { in: [...menuIds] } }, orderBy: { order: "asc" } });
    for (const item of allItems) {
      if (!menuItemsByMenu.has(item.menuId)) menuItemsByMenu.set(item.menuId, []);
      menuItemsByMenu.get(item.menuId)!.push(item);
    }
  }

  const targetIds = { page: new Set<string>(), post: new Set<string>(), category: new Set<string>() };
  for (const items of menuItemsByMenu.values()) collectTargetIds(items, targetIds);
  const lookups = await buildLookups(targetIds);

  const primaryMenu = settings.primaryMenuId ? buildMenuTree(menuItemsByMenu.get(settings.primaryMenuId) ?? [], lookups) : [];

  const footerColumns: ResolvedFooterColumn[] = footerColumnDefs.map((col) => {
    if (col.menuId) {
      const items = (menuItemsByMenu.get(col.menuId) ?? []).filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
      return { heading: col.heading, links: items.map((i) => ({ label: i.label, href: resolveMenuItemHref(i, lookups) })) };
    }
    return { heading: col.heading, links: (col.links ?? []).map((l) => ({ label: l.label, href: l.url })) };
  });

  const copyrightText = settings.copyrightText.replace(/\{year\}/g, String(new Date().getFullYear())).replace(/\{siteName\}/g, globalSettings.siteName);

  return {
    logo: { imageUrl: settings.logoImageUrl, altText: settings.logoAltText, text: settings.logoText },
    siteName: globalSettings.siteName,
    headerLayout: settings.headerLayout,
    headerSticky: settings.headerSticky,
    primaryMenu,
    footerColumns,
    socialLinks,
    copyrightText,
  };
});

function renderMenuNodeHtml(node: ResolvedMenuNode): string {
  const target = node.openInNewTab ? ` target="_blank" rel="noopener noreferrer"` : "";
  const children = node.children.length > 0 ? `<ul class="chrome-submenu">${node.children.map((c) => `<li>${renderMenuNodeHtml(c)}</li>`).join("")}</ul>` : "";
  return `<a href="${escapeAttr(node.href)}"${target}>${escapeHtml(node.label)}</a>${children}`;
}

export function renderHeaderHtml(chrome: ResolvedChrome): string {
  const logo = chrome.logo.imageUrl
    ? `<img src="${escapeAttr(chrome.logo.imageUrl)}" alt="${escapeAttr(chrome.logo.altText ?? chrome.siteName)}" class="chrome-logo-image" />`
    : escapeHtml(chrome.logo.text || chrome.siteName);
  const nav =
    chrome.primaryMenu.length > 0
      ? `<nav class="chrome-nav"><ul>${chrome.primaryMenu.map((node) => `<li>${renderMenuNodeHtml(node)}</li>`).join("")}</ul></nav>`
      : "";
  const stickyClass = chrome.headerSticky ? " chrome-header--sticky" : "";
  return `<header class="chrome-header chrome-header--${chrome.headerLayout}${stickyClass}"><a href="/" class="chrome-logo">${logo}</a>${nav}</header>`;
}

export function renderFooterHtml(chrome: ResolvedChrome): string {
  const columns = chrome.footerColumns
    .map(
      (col) =>
        `<div class="chrome-footer-column"><h3>${escapeHtml(col.heading)}</h3><ul>${col.links
          .map((l) => `<li><a href="${escapeAttr(l.href)}">${escapeHtml(l.label)}</a></li>`)
          .join("")}</ul></div>`
    )
    .join("");
  const social =
    chrome.socialLinks.length > 0
      ? `<div class="chrome-social">${chrome.socialLinks.map((s) => `<a href="${escapeAttr(s.url)}">${escapeHtml(s.platform)}</a>`).join("")}</div>`
      : "";
  return `<footer class="chrome-footer">${columns ? `<div class="chrome-footer-columns">${columns}</div>` : ""}${social}<p class="chrome-copyright">${escapeHtml(chrome.copyrightText)}</p></footer>`;
}
