import { describe, expect, it } from "vitest";
import { BRAND, NAV_ITEMS, PRINCIPLES, PRODUCT_PROMISES } from "./webData";

describe("webData", () => {
  it("brands the product as Voyage", () => {
    expect(BRAND.name).toBe("Voyage");
  });

  it("nav matches the trimmed /web section spine", () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      "overview",
      "principles",
      "confirmation",
      "handoff",
      "execution",
      "decisions",
    ]);
  });

  it("exposes product principles and promises without assignment framing", () => {
    expect(PRINCIPLES.length).toBe(5);
    expect(PRODUCT_PROMISES.length).toBeGreaterThan(0);
    const blob = [...PRINCIPLES.map((p) => p.body), ...PRODUCT_PROMISES].join(
      " ",
    );
    expect(blob.toLowerCase()).not.toContain("jupiter");
    expect(blob.toLowerCase()).not.toContain("assignment");
  });
});
