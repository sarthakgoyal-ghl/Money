/**
 * Warm the mapbox-gl chunk as soon as the prototype boots so the first map
 * mount does not wait on a cold dynamic import (~1.9 MB).
 */
import { basemapDisabledByUrl, hasMapboxToken } from "./env";

let prefetchPromise: Promise<typeof import("mapbox-gl")> | null = null;

export function prefetchMapbox(): void {
  if (!hasMapboxToken || basemapDisabledByUrl()) return;
  if (prefetchPromise) return;
  prefetchPromise = import("mapbox-gl").catch((error: unknown) => {
    prefetchPromise = null;
    throw error;
  });
}

/** Shared loader — reuses an in-flight prefetch when present. */
export function loadMapbox(): Promise<typeof import("mapbox-gl")> {
  prefetchMapbox();
  return prefetchPromise ?? import("mapbox-gl");
}
