import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  hasMapboxToken: true,
  basemapDisabledByUrl: () => false,
}));

describe("prefetchMapbox", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reuses one in-flight dynamic import across prefetch and load", async () => {
    const mod = await import("./prefetchMapbox");
    mod.prefetchMapbox();
    const first = mod.loadMapbox();
    const second = mod.loadMapbox();
    expect(first).toBe(second);
    await expect(first).resolves.toBeTruthy();
  });
});
