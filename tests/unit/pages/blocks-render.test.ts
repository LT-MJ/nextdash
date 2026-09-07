import { describe, it, expect } from "vitest";
import {
  renderBlocksToHtml,
  renderHeadingBlock,
  renderParagraphBlock,
  renderImageBlock,
  renderButtonBlock,
  renderColumnsBlock,
} from "@/lib/pages/blocks/render";
import type { Block } from "@/lib/pages/blocks/types";

describe("renderHeadingBlock", () => {
  it("escapes text content", () => {
    expect(renderHeadingBlock({ level: 2, text: "<script>alert(1)</script>" })).toBe("<h2>&lt;script&gt;alert(1)&lt;/script&gt;</h2>");
  });

  it("clamps the level to 1-6 (defense in depth against a stale stored document)", () => {
    const outOfRange = { level: 9, text: "Hi" } as unknown as Parameters<typeof renderHeadingBlock>[0];
    expect(renderHeadingBlock(outOfRange)).toBe("<h6>Hi</h6>");
  });
});

describe("renderParagraphBlock", () => {
  it("escapes attribute-breaking quotes and angle brackets", () => {
    const html = renderParagraphBlock({ text: 'He said "hi" <b>bold</b>' });
    expect(html).toBe('<p>He said "hi" &lt;b&gt;bold&lt;/b&gt;</p>');
  });

  it("applies text-align via a style attribute", () => {
    expect(renderParagraphBlock({ text: "hi", align: "center" })).toContain('style="text-align:center"');
  });
});

describe("renderImageBlock", () => {
  it("escapes src and alt as attributes", () => {
    const html = renderImageBlock({ src: "/a.jpg", alt: 'a "cat"' });
    expect(html).toContain('src="/a.jpg"');
    expect(html).toContain('alt="a &quot;cat&quot;"');
  });

  it("neutralizes a javascript: URL to a safe #", () => {
    const html = renderImageBlock({ src: "javascript:alert(1)", alt: "x" });
    expect(html).toContain('src="#"');
  });

  it("wraps in a link when href is set", () => {
    const html = renderImageBlock({ src: "/a.jpg", alt: "x", href: "/target" });
    expect(html).toMatch(/<a href="\/target"><img[^>]*\/><\/a>/);
  });

  it("neutralizes an unsafe href", () => {
    const html = renderImageBlock({ src: "/a.jpg", alt: "x", href: "javascript:alert(1)" });
    expect(html).toContain('<a href="#">');
  });
});

describe("renderButtonBlock", () => {
  it("escapes button text and rejects unsafe hrefs", () => {
    const html = renderButtonBlock({ text: "<b>Click</b>", href: "data:text/html,evil" });
    expect(html).toContain("&lt;b&gt;Click&lt;/b&gt;");
    expect(html).toContain('href="#"');
  });

  it("allows a safe https href through untouched", () => {
    const html = renderButtonBlock({ text: "Go", href: "https://example.com" });
    expect(html).toContain('href="https://example.com"');
  });
});

describe("renderColumnsBlock", () => {
  it("renders each column's nested blocks and the column count as a data attribute", () => {
    const html = renderColumnsBlock({
      columns: 2,
      items: [
        [{ id: "a", type: "paragraph", data: { text: "left" } }],
        [{ id: "b", type: "paragraph", data: { text: "right" } }],
      ],
    });
    expect(html).toContain('data-columns="2"');
    expect(html).toContain("<p>left</p>");
    expect(html).toContain("<p>right</p>");
  });
});

describe("renderBlocksToHtml", () => {
  it("renders customHtml blocks unescaped (the deliberate trust boundary)", () => {
    const blocks: Block[] = [{ id: "a", type: "customHtml", data: { html: "<strong>trusted</strong>" } }];
    expect(renderBlocksToHtml(blocks)).toBe("<strong>trusted</strong>");
  });

  it("renders an empty document as an empty string", () => {
    expect(renderBlocksToHtml([])).toBe("");
  });

  it("renders multiple blocks in order, joined by newlines", () => {
    const blocks: Block[] = [
      { id: "a", type: "heading", data: { level: 1, text: "Title" } },
      { id: "b", type: "divider", data: {} },
      { id: "c", type: "paragraph", data: { text: "Body" } },
    ];
    expect(renderBlocksToHtml(blocks)).toBe('<h1>Title</h1>\n<hr class="blocks-divider" />\n<p>Body</p>');
  });
});
