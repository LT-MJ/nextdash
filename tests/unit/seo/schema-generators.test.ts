import { describe, it, expect } from "vitest";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";

describe("schema generators", () => {
  it("generates valid Organization JSON-LD", () => {
    const schema = getSchemaGenerator("Organization")!.generate({ name: "Acme", url: "https://acme.test" });
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("Acme");
  });

  it("omits optional fields entirely rather than emitting null/undefined", () => {
    const schema = getSchemaGenerator("Organization")!.generate({ name: "Acme", url: "https://acme.test" });
    expect(schema).not.toHaveProperty("logo");
    expect(schema).not.toHaveProperty("contactPoint");
  });

  it("never fabricates a Product aggregateRating when none is supplied", () => {
    const schema = getSchemaGenerator("Product")!.generate({
      name: "Widget",
      url: "https://acme.test/widget",
      price: 9.99,
      currency: "USD",
      availability: "InStock",
    });
    expect(schema).not.toHaveProperty("aggregateRating");
  });

  it("includes aggregateRating only when real rating data is passed", () => {
    const schema = getSchemaGenerator("Product")!.generate({
      name: "Widget",
      url: "https://acme.test/widget",
      price: 9.99,
      currency: "USD",
      availability: "InStock",
      aggregateRating: { ratingValue: 4.5, reviewCount: 12 },
    });
    expect(schema.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 12 });
  });

  it("builds a BreadcrumbList with sequential positions", () => {
    const schema = getSchemaGenerator("BreadcrumbList")!.generate({
      items: [
        { name: "Home", url: "https://acme.test" },
        { name: "Blog", url: "https://acme.test/blog" },
      ],
    });
    const list = schema.itemListElement as { position: number }[];
    expect(list[0].position).toBe(1);
    expect(list[1].position).toBe(2);
  });
});
