import { describe, expect, it } from "vitest";
import {
  normalizePathname,
  resolveAppPath,
  shouldPrefetchMapbox,
} from "./pathRoute";

describe("pathRoute", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizePathname("/web/")).toBe("/web");
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("")).toBe("/");
  });

  it("resolves microsite and prototype paths", () => {
    expect(resolveAppPath("/web")).toBe("web");
    expect(resolveAppPath("/web/")).toBe("web");
    expect(resolveAppPath("/handover")).toBe("handover");
    expect(resolveAppPath("/")).toBe("prototype");
    expect(resolveAppPath("/proposal")).toBe("prototype");
  });

  it("skips Mapbox prefetch on microsites only", () => {
    expect(shouldPrefetchMapbox("/")).toBe(true);
    expect(shouldPrefetchMapbox("/handover")).toBe(false);
    expect(shouldPrefetchMapbox("/web")).toBe(false);
  });
});
