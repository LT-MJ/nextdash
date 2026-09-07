import { describe, it, expect } from "vitest";
import { blockDocumentSchema, parseBlocks } from "@/lib/pages/blocks/schema";
import { isSafeUrl } from "@/lib/pages/blocks/url-safety";

describe("isSafeUrl", () => {
  it("allows relative paths, fragments, and http(s)/mailto/tel", () => {
    expect(isSafeUrl("/about")).toBe(true);
    expect(isSafeUrl("#section")).toBe(true);
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("mailto:a@b.com")).toBe(true);
    expect(isSafeUrl("tel:+15551234567")).toBe(true);
  });

  it("rejects javascript:, data:, and other dangerous schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,evil")).toBe(false);
    expect(isSafeUrl("vbscript:evil")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("blockDocumentSchema", () => {
  it("accepts a valid document", () => {
    const result = blockDocumentSchema.safeParse([{ id: "a", type: "heading", data: { level: 2, text: "Hi" } }]);
    expect(result.success).toBe(true);
  });

  it("rejects a columns block nested inside another columns block", () => {
    const result = blockDocumentSchema.safeParse([
      {
        id: "outer",
        type: "columns",
        data: {
          columns: 2,
          items: [[{ id: "inner", type: "columns", data: { columns: 2, items: [[], []] } }], []],
        },
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects an unsafe URL in an image block", () => {
    const result = blockDocumentSchema.safeParse([{ id: "a", type: "image", data: { src: "javascript:alert(1)", alt: "x" } }]);
    expect(result.success).toBe(false);
  });

  it("rejects a document longer than 300 blocks", () => {
    const blocks = Array.from({ length: 301 }, (_, i) => ({ id: `b${i}`, type: "divider", data: {} }));
    expect(blockDocumentSchema.safeParse(blocks).success).toBe(false);
  });
});

describe("parseBlocks", () => {
  it("returns [] for null/undefined input", () => {
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks(undefined)).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    expect(parseBlocks("{not valid json")).toEqual([]);
  });

  it("returns [] when the parsed JSON fails schema validation", () => {
    expect(parseBlocks(JSON.stringify([{ id: "a", type: "not-a-real-type", data: {} }]))).toEqual([]);
  });

  it("returns the parsed blocks for a valid document", () => {
    const raw = JSON.stringify([{ id: "a", type: "divider", data: {} }]);
    expect(parseBlocks(raw)).toEqual([{ id: "a", type: "divider", data: {} }]);
  });
});
