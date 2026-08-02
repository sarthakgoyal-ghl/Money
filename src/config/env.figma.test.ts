import { describe, expect, it } from "vitest";
import { getFigmaFileTitle, getFigmaUrl, toFigmaEmbedUrl } from "./env";

const FIGMA_URL =
  "https://www.figma.com/design/MWmZGMYwUfaKRxzmhsOM1o/Jupiter-Money-%7C-UX-Design-Assignment?node-id=0-1";

describe("getFigmaUrl", () => {
  it("returns a valid figma.com https URL", () => {
    const url = getFigmaUrl();
    expect(url).toMatch(/^https:\/\/www\.figma\.com\/design\//);
    expect(url).toContain("MWmZGMYwUfaKRxzmhsOM1o");
  });
});

describe("toFigmaEmbedUrl", () => {
  it("builds a share embed URL for a Figma design link", () => {
    const embed = toFigmaEmbedUrl(FIGMA_URL);
    expect(embed).toMatch(/^https:\/\/www\.figma\.com\/embed\?/);
    expect(embed).toContain("embed_host=share");
    expect(embed).toContain("MWmZGMYwUfaKRxzmhsOM1o");
  });

  it("rejects non-Figma hosts", () => {
    expect(toFigmaEmbedUrl("https://example.com/file")).toBeNull();
  });
});

describe("getFigmaFileTitle", () => {
  it("decodes the file slug into a readable title", () => {
    expect(getFigmaFileTitle(FIGMA_URL)).toBe(
      "Jupiter Money | UX Design Assignment",
    );
  });
});
