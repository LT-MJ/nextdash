import type { Metadata } from "next";
import { db } from "@/lib/server/db";
import type { ContentTypeKey, ResolvedSeo } from "@/types/seo";
import { getContentTypeSettings, getGlobalSeoSettings } from "./services/settings";
import { renderTemplate, type TemplateVariables } from "./template";

export interface ResolveSeoParams {
  entityType: ContentTypeKey;
  entityId: string;
  /** Path (e.g. "/blog/my-post") used to build the canonical URL when no override is set. */
  path: string;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackImage?: string | null;
  templateVars?: TemplateVariables;
}

/**
 * The single entry point for resolving SEO metadata anywhere in the app.
 * Priority: entity-level SeoMetadata → content-type defaults → global
 * defaults → hard fallback (spec §52). Every public page should call this
 * (directly or via a thin per-content-type wrapper) instead of rebuilding
 * metadata inline.
 */
export async function resolveSeo(params: ResolveSeoParams): Promise<ResolvedSeo> {
  const [entity, contentTypeSettings, globalSettings] = await Promise.all([
    db.seoMetadata.findUnique({ where: { entityType_entityId: { entityType: params.entityType, entityId: params.entityId } } }),
    getContentTypeSettings(params.entityType),
    getGlobalSeoSettings(),
  ]);

  const vars: TemplateVariables = {
    title: params.fallbackTitle,
    siteName: globalSettings.siteName,
    sep: globalSettings.titleSeparator,
    ...params.templateVars,
  };

  const title =
    entity?.title ||
    (contentTypeSettings.titleTemplate ? renderTemplate(contentTypeSettings.titleTemplate, vars) : null) ||
    renderTemplate(globalSettings.defaultTitleTemplate, vars) ||
    params.fallbackTitle;

  const description =
    entity?.description ||
    (contentTypeSettings.descriptionTemplate ? renderTemplate(contentTypeSettings.descriptionTemplate, vars) : null) ||
    (globalSettings.defaultDescriptionTemplate ? renderTemplate(globalSettings.defaultDescriptionTemplate, vars) : null) ||
    params.fallbackDescription ||
    null;

  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const canonicalUrl =
    entity?.canonicalMode === "CUSTOM" && entity.canonicalUrl ? entity.canonicalUrl : `${siteUrl}${params.path}`;

  const robotsIndex = entity?.robotsIndex ?? contentTypeSettings.robotsIndexDefault ?? globalSettings.defaultRobotsIndex;
  const robotsFollow = entity?.robotsFollow ?? contentTypeSettings.robotsFollowDefault ?? globalSettings.defaultRobotsFollow;

  const directiveParts = [robotsIndex ? "index" : "noindex", robotsFollow ? "follow" : "nofollow"];
  if (entity?.robotsNoarchive) directiveParts.push("noarchive");
  if (entity?.robotsNosnippet) directiveParts.push("nosnippet");
  if (entity?.robotsNoimageindex) directiveParts.push("noimageindex");
  if (entity?.robotsMaxSnippet != null) directiveParts.push(`max-snippet:${entity.robotsMaxSnippet}`);
  if (entity?.robotsMaxImagePreview) directiveParts.push(`max-image-preview:${entity.robotsMaxImagePreview}`);

  const ogImage = entity?.ogImage || params.fallbackImage || globalSettings.defaultSocialImage || null;

  return {
    title,
    description,
    canonicalUrl,
    robotsIndex,
    robotsFollow,
    robotsDirectives: directiveParts.join(", "),
    ogTitle: entity?.ogTitle || title,
    ogDescription: entity?.ogDescription || description,
    ogImage,
    // Next.js's typed `openGraph.type` only accepts a fixed set of values
    // (website/article/book/profile/music.*/video.*) — "product" is NOT
    // among them, even though it's common in the wild via the OG product
    // namespace extension. Passing an unsupported value throws inside
    // Next's metadata renderer and silently blanks out the entire page's
    // <head> in production. Products default to "website" here; a real
    // og:type="product" tag would need to be injected outside the typed
    // metadata API (e.g. a raw <meta> tag in the page itself).
    ogType: entity?.ogType || (params.entityType === "post" ? "article" : "website"),
    twitterCard: entity?.twitterCard || "summary_large_image",
    twitterTitle: entity?.twitterTitle || title,
    twitterDescription: entity?.twitterDescription || description,
    twitterImage: entity?.twitterImage || ogImage,
    schemaType: entity?.schemaType || contentTypeSettings.schemaTypeDefault,
  };
}

// Next.js's typed `openGraph.type` throws at render time for anything
// outside this fixed set (spec-correct OG values it doesn't support, like
// "product", are NOT included). Validate rather than blindly casting —
// bad data here previously blanked an entire page's <head> in production
// with no visible error.
const VALID_OG_TYPES = new Set([
  "website",
  "article",
  "book",
  "profile",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
]);

const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "app", "player"]);

/** Converts a ResolvedSeo object into a Next.js `generateMetadata()` return value. */
export function toNextMetadata(resolved: ResolvedSeo): Metadata {
  const ogType = VALID_OG_TYPES.has(resolved.ogType) ? resolved.ogType : "website";
  const twitterCard = VALID_TWITTER_CARDS.has(resolved.twitterCard) ? resolved.twitterCard : "summary_large_image";

  return {
    title: resolved.title,
    description: resolved.description ?? undefined,
    alternates: { canonical: resolved.canonicalUrl },
    robots: {
      index: resolved.robotsIndex,
      follow: resolved.robotsFollow,
    },
    openGraph: {
      title: resolved.ogTitle,
      description: resolved.ogDescription ?? undefined,
      url: resolved.canonicalUrl,
      type: ogType as never,
      images: resolved.ogImage ? [{ url: resolved.ogImage }] : undefined,
    },
    twitter: {
      card: twitterCard as never,
      title: resolved.twitterTitle,
      description: resolved.twitterDescription ?? undefined,
      images: resolved.twitterImage ? [resolved.twitterImage] : undefined,
    },
  };
}

/** Convenience wrapper: resolve + convert in one call for use inside `generateMetadata()`. */
export async function resolvePageMetadata(params: ResolveSeoParams): Promise<Metadata> {
  const resolved = await resolveSeo(params);
  return toNextMetadata(resolved);
}
