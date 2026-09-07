/**
 * Schema.org JSON-LD generators. Each generator is a pure function taking a
 * typed data object and returning a plain JSON-LD-ready record. Register new
 * types via `registerSchemaGenerator` (spec §33/§85) rather than editing
 * callers throughout the app.
 */

export interface SchemaGenerator<T = Record<string, unknown>> {
  type: string;
  generate(data: T): Record<string, unknown>;
}

const generators = new Map<string, SchemaGenerator<Record<string, unknown>>>();

export function registerSchemaGenerator<T>(generator: SchemaGenerator<T>): void {
  // Heterogeneous registry by design: each generator is authored against its
  // own typed input, but stored/retrieved through a single untyped map.
  generators.set(generator.type, generator as unknown as SchemaGenerator<Record<string, unknown>>);
}

export function getSchemaGenerator(type: string): SchemaGenerator<Record<string, unknown>> | undefined {
  return generators.get(type);
}

// ---------------------------------------------------------------------------

export interface OrganizationData {
  name: string;
  url: string;
  logo?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialProfiles?: string[];
}

registerSchemaGenerator<OrganizationData>({
  type: "Organization",
  generate(data: OrganizationData) {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: data.name,
      url: data.url,
      ...(data.logo ? { logo: data.logo } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.contactEmail || data.contactPhone
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              ...(data.contactEmail ? { email: data.contactEmail } : {}),
              ...(data.contactPhone ? { telephone: data.contactPhone } : {}),
              contactType: "customer support",
            },
          }
        : {}),
      ...(data.socialProfiles && data.socialProfiles.length > 0 ? { sameAs: data.socialProfiles } : {}),
    };
  },
});

export interface WebsiteData {
  name: string;
  url: string;
  alternateName?: string | null;
  searchUrlTemplate?: string | null;
}

registerSchemaGenerator<WebsiteData>({
  type: "WebSite",
  generate(data: WebsiteData) {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: data.name,
      url: data.url,
      ...(data.alternateName ? { alternateName: data.alternateName } : {}),
      ...(data.searchUrlTemplate
        ? {
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: data.searchUrlTemplate },
              "query-input": "required name=search_term_string",
            },
          }
        : {}),
    };
  },
});

export interface WebPageData {
  name: string;
  url: string;
  description?: string | null;
  breadcrumb?: Record<string, unknown> | null;
}

registerSchemaGenerator<WebPageData>({
  type: "WebPage",
  generate(data: WebPageData) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: data.name,
      url: data.url,
      ...(data.description ? { description: data.description } : {}),
      ...(data.breadcrumb ? { breadcrumb: data.breadcrumb } : {}),
    };
  },
});

export interface ArticleData {
  headline: string;
  description?: string | null;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  publisherName: string;
  publisherLogo?: string | null;
  variant?: "Article" | "BlogPosting";
}

registerSchemaGenerator<ArticleData>({
  type: "Article",
  generate(data: ArticleData) {
    return {
      "@context": "https://schema.org",
      "@type": data.variant ?? "Article",
      headline: data.headline,
      ...(data.description ? { description: data.description } : {}),
      mainEntityOfPage: { "@type": "WebPage", "@id": data.url },
      ...(data.image ? { image: [data.image] } : {}),
      ...(data.datePublished ? { datePublished: data.datePublished } : {}),
      ...(data.dateModified ? { dateModified: data.dateModified } : {}),
      ...(data.authorName ? { author: { "@type": "Person", name: data.authorName } } : {}),
      publisher: {
        "@type": "Organization",
        name: data.publisherName,
        ...(data.publisherLogo ? { logo: { "@type": "ImageObject", url: data.publisherLogo } } : {}),
      },
    };
  },
});

export interface ProductData {
  name: string;
  description?: string | null;
  image?: string[] | null;
  sku?: string | null;
  brand?: string | null;
  url: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder" | "BackOrder";
  condition?: "NewCondition" | "UsedCondition" | "RefurbishedCondition";
  aggregateRating?: { ratingValue: number; reviewCount: number } | null;
}

registerSchemaGenerator<ProductData>({
  type: "Product",
  generate(data: ProductData) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: data.name,
      ...(data.description ? { description: data.description } : {}),
      ...(data.image && data.image.length > 0 ? { image: data.image } : {}),
      ...(data.sku ? { sku: data.sku } : {}),
      ...(data.brand ? { brand: { "@type": "Brand", name: data.brand } } : {}),
      offers: {
        "@type": "Offer",
        url: data.url,
        priceCurrency: data.currency,
        price: data.price.toFixed(2),
        availability: `https://schema.org/${data.availability}`,
        ...(data.condition ? { itemCondition: `https://schema.org/${data.condition}` } : {}),
      },
      // Never fabricate ratings/reviews (spec §125/§133) — only emit when real data exists.
      ...(data.aggregateRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: data.aggregateRating.ratingValue,
              reviewCount: data.aggregateRating.reviewCount,
            },
          }
        : {}),
    };
  },
});

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbData {
  items: BreadcrumbItem[];
}

registerSchemaGenerator<BreadcrumbData>({
  type: "BreadcrumbList",
  generate(data: BreadcrumbData) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: data.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        // Defensive fallback: getSchemaGenerator() erases the specific
        // BreadcrumbData type (the registry stores generators as
        // SchemaGenerator<Record<string, unknown>>), so a caller passing
        // {label, url} instead of {name, url} isn't caught by tsc — it
        // happened once already. Never silently emit a nameless ListItem.
        name: item.name ?? (item as unknown as { label?: string }).label ?? "",
        item: item.url,
      })),
    };
  },
});

export interface LocalBusinessData {
  businessType: string;
  name: string;
  streetAddress?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  priceRange?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo?: string | null;
  website?: string | null;
  openingHours?: Record<string, string> | null;
  socialProfiles?: string[];
}

registerSchemaGenerator<LocalBusinessData>({
  type: "LocalBusiness",
  generate(data: LocalBusinessData) {
    return {
      "@context": "https://schema.org",
      "@type": data.businessType || "LocalBusiness",
      name: data.name,
      ...(data.streetAddress || data.city
        ? {
            address: {
              "@type": "PostalAddress",
              ...(data.streetAddress ? { streetAddress: data.streetAddress } : {}),
              ...(data.city ? { addressLocality: data.city } : {}),
              ...(data.region ? { addressRegion: data.region } : {}),
              ...(data.postalCode ? { postalCode: data.postalCode } : {}),
              ...(data.country ? { addressCountry: data.country } : {}),
            },
          }
        : {}),
      ...(data.phone ? { telephone: data.phone } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.priceRange ? { priceRange: data.priceRange } : {}),
      ...(data.latitude && data.longitude
        ? { geo: { "@type": "GeoCoordinates", latitude: data.latitude, longitude: data.longitude } }
        : {}),
      ...(data.logo ? { logo: data.logo } : {}),
      ...(data.website ? { url: data.website } : {}),
      ...(data.openingHours
        ? {
            openingHoursSpecification: Object.entries(data.openingHours).map(([day, hours]) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: day,
              ...(hours ? { opens: hours.split("-")[0], closes: hours.split("-")[1] } : {}),
            })),
          }
        : {}),
      ...(data.socialProfiles && data.socialProfiles.length > 0 ? { sameAs: data.socialProfiles } : {}),
    };
  },
});

export interface FaqData {
  items: { question: string; answer: string }[];
}

registerSchemaGenerator<FaqData>({
  type: "FAQPage",
  generate(data: FaqData) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };
  },
});

export interface PersonData {
  name: string;
  url?: string | null;
  image?: string | null;
  jobTitle?: string | null;
  description?: string | null;
  sameAs?: string[];
}

registerSchemaGenerator<PersonData>({
  type: "Person",
  generate(data: PersonData) {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: data.name,
      ...(data.url ? { url: data.url } : {}),
      ...(data.image ? { image: data.image } : {}),
      ...(data.jobTitle ? { jobTitle: data.jobTitle } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.sameAs && data.sameAs.length > 0 ? { sameAs: data.sameAs } : {}),
    };
  },
});
