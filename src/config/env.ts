/**
 * The only place environment values are read.
 *
 * Tokens are never hardcoded in source. `VITE_MAPBOX_TOKEN` comes from
 * `.env.local`, which is git-ignored; `.env.example` documents the key with an
 * empty value.
 *
 * Note that anything prefixed `VITE_` is inlined into the client bundle by
 * design — it is readable by anyone who loads the page. That is acceptable only
 * for Mapbox *public* (`pk.`) tokens, which are meant for browser use and must
 * be restricted by URL in the Mapbox account. A secret (`sk.`) token must never
 * be placed here.
 *
 * `VITE_FIGMA_URL` is likewise public (a shareable Figma link) and optional.
 * When unset or invalid, the assignment file URL is used so /handover keeps a
 * Figma control without depending on Vercel env wiring.
 */

/** Public assignment file — safe to ship; override with `VITE_FIGMA_URL`. */
const DEFAULT_FIGMA_URL =
  "https://www.figma.com/design/MWmZGMYwUfaKRxzmhsOM1o/Jupiter-Money-%7C-UX-Design-Assignment?node-id=0-1";

const rawMapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? "";

/** Public Mapbox token, or null when unconfigured. */
export const mapboxToken: string | null = rawMapboxToken.length > 0 ? rawMapboxToken : null;

/**
 * Whether a Mapbox-backed basemap can be used. When false, the prototype keeps
 * its original SVG route canvas rather than failing — the journey visual must
 * never depend on a network service being reachable.
 */
export const hasMapboxToken = mapboxToken !== null;

/** Guards against a secret token being pasted into a client-side variable. */
export function assertPublicMapboxToken(token: string): void {
  if (token.startsWith("sk.")) {
    throw new Error(
      "VITE_MAPBOX_TOKEN looks like a secret token (sk.*). Client-side env values are inlined into the bundle. Use a public pk.* token restricted by URL.",
    );
  }
}

function parseFigmaUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!/(^|\.)figma\.com$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Public Figma file URL for the handover microsite.
 * Prefers `VITE_FIGMA_URL` when valid; otherwise the assignment default.
 */
export function getFigmaUrl(): string | null {
  const fromEnv = parseFigmaUrl(import.meta.env.VITE_FIGMA_URL?.trim() ?? "");
  return fromEnv ?? parseFigmaUrl(DEFAULT_FIGMA_URL);
}

/** Figma embed iframe src for an in-page file viewer. */
export function toFigmaEmbedUrl(figmaUrl: string): string | null {
  try {
    const url = new URL(figmaUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!/(^|\.)figma\.com$/i.test(url.hostname)) return null;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url.toString())}`;
  } catch {
    return null;
  }
}

/** Human title from the Figma file slug (fallback when unset). */
export function getFigmaFileTitle(figmaUrl: string): string {
  try {
    const parts = new URL(figmaUrl).pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] ?? "";
    const decoded = decodeURIComponent(slug).replace(/-/g, " ").trim();
    return decoded || "Figma file";
  } catch {
    return "Figma file";
  }
}

/**
 * `?basemap=off` forces the offline SVG canvas even when a token is present.
 *
 * Keeps both renderings reviewable side by side, and lets the test suite
 * exercise the fallback path without unsetting the environment.
 */
export function basemapDisabledByUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("basemap") === "off";
}
