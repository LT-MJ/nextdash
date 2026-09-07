import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/lib/seo/template";

describe("renderTemplate", () => {
  it("substitutes known variables", () => {
    expect(renderTemplate("{title} {sep} {siteName}", { title: "My Post", sep: "|", siteName: "Nextdash" })).toBe("My Post | Nextdash");
  });

  it("drops missing variables and trims stray separators", () => {
    expect(renderTemplate("{title} {sep} {siteName}", { title: "My Post", sep: "|", siteName: null })).toBe("My Post");
  });

  it("leaves unknown tokens untouched by rendering them empty", () => {
    expect(renderTemplate("{title} - {unknown}", { title: "Hello" })).toBe("Hello");
  });

  it("collapses internal whitespace", () => {
    expect(renderTemplate("{title}   {siteName}", { title: "A", siteName: "B" })).toBe("A B");
  });
});
