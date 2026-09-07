import { describe, it, expect } from "vitest";
import { analyzeSeo } from "@/lib/seo/scoring";
import type { SeoAnalysisInput } from "@/types/seo";

function baseInput(overrides: Partial<SeoAnalysisInput> = {}): SeoAnalysisInput {
  return {
    entityType: "post",
    entityId: "test-1",
    url: "/blog/ergonomic-office-chairs",
    slug: "ergonomic-office-chairs",
    seoTitle: "Ergonomic Office Chairs — A Buyer's Guide",
    metaDescription:
      "A complete guide to choosing an ergonomic office chair, covering lumbar support, adjustability, and materials.",
    focusKeyword: "ergonomic office chair",
    additionalKeywords: [],
    contentHtml:
      "<h1>Ergonomic Office Chairs</h1><p>" +
      "An ergonomic office chair supports your back during long work sessions. ".repeat(30) +
      '</p><h2>Why an ergonomic office chair matters</h2><p>More detail about the ergonomic office chair here. ' +
      "Filler sentence to add length. ".repeat(20) +
      '</p><img src="/chair.jpg" alt="ergonomic office chair in a home office" />' +
      '<a href="/blog/standing-desks">standing desks</a><a href="https://example.org/research">external research</a>',
    robotsIndex: true,
    canonicalUrl: "https://example.com/blog/ergonomic-office-chairs",
    schemaType: "BlogPosting",
    hasCustomSchema: false,
    sitemapInclude: true,
    ...overrides,
  };
}

describe("analyzeSeo", () => {
  it("produces a high score for well-optimized content", () => {
    const result = analyzeSeo(baseInput());
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.grade).not.toBe("CRITICAL");
  });

  it("penalizes missing title and description heavily", () => {
    const result = analyzeSeo(baseInput({ seoTitle: null, metaDescription: null }));
    const titleRule = result.results.find((r) => r.rule === "titleMissing");
    const descRule = result.results.find((r) => r.rule === "descriptionMissing");
    expect(titleRule?.status).toBe("FAIL");
    expect(descRule?.status).toBe("FAIL");
  });

  it("marks keyword rules NOT_APPLICABLE when no focus keyword is set, and excludes them from the score denominator", () => {
    const withKeyword = analyzeSeo(baseInput());
    const withoutKeyword = analyzeSeo(baseInput({ focusKeyword: null }));

    const keywordInTitle = withoutKeyword.results.find((r) => r.rule === "keywordInTitle");
    expect(keywordInTitle?.status).toBe("NOT_APPLICABLE");

    // Every NOT_APPLICABLE result contributes 0/0 rather than being counted as a failure.
    const notApplicable = withoutKeyword.results.filter((r) => r.status === "NOT_APPLICABLE");
    expect(notApplicable.every((r) => r.score === 0)).toBe(true);
    expect(withKeyword.results.find((r) => r.rule === "keywordNotUsed")?.status).toBe("PASS");
  });

  it("does not apply structural content rules (TOC, subheadings) to product content", () => {
    const productResult = analyzeSeo(baseInput({ entityType: "product", contentHtml: "<p>Short product description.</p>" }));
    const tocRule = productResult.results.find((r) => r.rule === "contentHasTOC");
    const subheadingRule = productResult.results.find((r) => r.rule === "keywordInSubheadings");
    expect(tocRule).toBeUndefined();
    expect(subheadingRule).toBeUndefined();
  });

  it("flags a missing H1", () => {
    const result = analyzeSeo(baseInput({ contentHtml: "<p>No heading at all here, just paragraph text.</p>" }));
    const h1Rule = result.results.find((r) => r.rule === "h1Missing");
    expect(h1Rule?.status).toBe("FAIL");
  });

  it("flags images missing ALT text", () => {
    const result = analyzeSeo(baseInput({ contentHtml: '<h1>Title</h1><p>Body text here.</p><img src="/a.jpg" />' }));
    const altRule = result.results.find((r) => r.rule === "imageAltMissing");
    expect(altRule?.status).toBe("FAIL");
  });

  it("respects rule overrides (disabling a rule removes it from scoring)", () => {
    const result = analyzeSeo(baseInput(), { overrides: [{ key: "titleHasNumber", enabled: false }] });
    expect(result.results.find((r) => r.rule === "titleHasNumber")).toBeUndefined();
  });

  it("flags thin content below the configured threshold", () => {
    const result = analyzeSeo(baseInput({ contentHtml: "<h1>Title</h1><p>Only a few words here.</p>" }), {
      thresholds: { thinContentWords: 300 },
    });
    const lengthRule = result.results.find((r) => r.rule === "lengthContent");
    expect(lengthRule?.status).toBe("WARNING");
  });
});
