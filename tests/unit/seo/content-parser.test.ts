import { describe, it, expect } from "vitest";
import { extractHeadings, extractImages, extractLinks, extractParagraphs, toPlainText, countWords } from "@/lib/seo/content-parser";

describe("extractHeadings", () => {
  it("extracts heading level and text", () => {
    const html = "<h1>Main title</h1><p>intro</p><h2>Section one</h2><h3>Sub section</h3>";
    expect(extractHeadings(html)).toEqual([
      { level: 1, text: "Main title" },
      { level: 2, text: "Section one" },
      { level: 3, text: "Sub section" },
    ]);
  });

  it("returns an empty array when there are no headings", () => {
    expect(extractHeadings("<p>just a paragraph</p>")).toEqual([]);
  });
});

describe("extractImages", () => {
  it("captures src and alt", () => {
    const html = '<img src="/a.jpg" alt="A description" />';
    expect(extractImages(html)).toEqual([{ src: "/a.jpg", alt: "A description" }]);
  });

  it("distinguishes a missing alt attribute from an empty one", () => {
    const html = '<img src="/a.jpg" /><img src="/b.jpg" alt="" />';
    const images = extractImages(html);
    expect(images[0].alt).toBeNull();
    expect(images[1].alt).toBe("");
  });
});

describe("extractLinks", () => {
  it("classifies relative links as internal", () => {
    const html = '<a href="/about">About</a>';
    expect(extractLinks(html)).toEqual([{ href: "/about", text: "About", internal: true }]);
  });

  it("classifies same-host absolute links as internal when siteHost is given", () => {
    const html = '<a href="https://example.com/page">Page</a>';
    expect(extractLinks(html, "example.com")[0].internal).toBe(true);
  });

  it("classifies other-host absolute links as external", () => {
    const html = '<a href="https://other.com/page">Page</a>';
    expect(extractLinks(html, "example.com")[0].internal).toBe(false);
  });

  it("classifies mailto/tel links as external", () => {
    const html = '<a href="mailto:test@example.com">Email</a>';
    expect(extractLinks(html)[0].internal).toBe(false);
  });
});

describe("extractParagraphs", () => {
  it("strips tags from paragraph content", () => {
    const html = "<p>Hello <strong>world</strong></p><p>Second paragraph</p>";
    expect(extractParagraphs(html)).toEqual(["Hello world", "Second paragraph"]);
  });
});

describe("toPlainText / countWords", () => {
  it("strips all markup and normalizes whitespace", () => {
    expect(toPlainText("<p>Hello&nbsp;<strong>world</strong></p>")).toBe("Hello world");
  });

  it("counts words in plain text", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});
