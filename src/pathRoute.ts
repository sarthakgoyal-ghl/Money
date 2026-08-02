/**
 * Lightweight path routing for the Vite SPA — no router dependency.
 * Prototype stays at `/`; microsites mount at `/handover` and `/web`.
 */

export type AppPath = "prototype" | "handover" | "web";

/** Normalize trailing slashes so `/web/` and `/web` resolve the same. */
export function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function resolveAppPath(pathname: string): AppPath {
  const path = normalizePathname(pathname);
  if (path === "/handover") return "handover";
  if (path === "/web") return "web";
  return "prototype";
}

/** Mapbox is only needed for the interactive prototype. */
export function shouldPrefetchMapbox(pathname: string): boolean {
  return resolveAppPath(pathname) === "prototype";
}
