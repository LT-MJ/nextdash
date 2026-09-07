import { describe, it, expect } from "vitest";
import { normalize, containsKeyword, countOccurrences, calculateKeywordDensity, keywordInFirstPortion } from "@/lib/seo/keyword";

describe("normalize", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalize("Hello, World!")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalize("  too   many   spaces  ")).toBe("too many spaces");
  });
});

describe("containsKeyword", () => {
  it("matches an exact phrase", () => {
    expect(containsKeyword("This is an ergonomic office chair.", "office chair")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(containsKeyword("ERGONOMIC OFFICE CHAIR", "office chair")).toBe(true);
  });

  it("matches simple plural variants for single words", () => {
    expect(containsKeyword("We sell many chairs here.", "chair")).toBe(true);
  });

  it("returns false when the keyword is absent", () => {
    expect(containsKeyword("A completely unrelated sentence.", "office chair")).toBe(false);
  });

  it("returns false for empty inputs", () => {
    expect(containsKeyword(null, "keyword")).toBe(false);
    expect(containsKeyword("some text", null)).toBe(false);
  });
});

describe("countOccurrences", () => {
  it("counts repeated phrase occurrences", () => {
    expect(countOccurrences("chair chair chair", "chair")).toBe(3);
  });

  it("returns 0 when absent", () => {
    expect(countOccurrences("nothing here", "chair")).toBe(0);
  });
});

describe("calculateKeywordDensity", () => {
  it("computes a density percentage from occurrences and word count", () => {
    const text = "chair chair table lamp desk shelf";
    const result = calculateKeywordDensity(text, "chair");
    expect(result.occurrences).toBe(2);
    expect(result.densityPercent).toBeGreaterThan(0);
  });

  it("returns zero density when the keyword never appears", () => {
    const result = calculateKeywordDensity("table lamp desk shelf", "chair");
    expect(result.occurrences).toBe(0);
    expect(result.densityPercent).toBe(0);
  });
});

describe("keywordInFirstPortion", () => {
  it("finds a keyword within the configured leading fraction", () => {
    const text = "Office chairs are great. ".repeat(20) + "Filler text follows for a long while to push length up.";
    expect(keywordInFirstPortion(text, "office chairs", 0.1)).toBe(true);
  });

  it("returns false when the keyword only appears later in a long text", () => {
    const filler = "unrelated padding text ".repeat(200);
    const text = `${filler} the special keyword phrase appears only here`;
    expect(keywordInFirstPortion(text, "special keyword phrase", 0.05)).toBe(false);
  });
});
