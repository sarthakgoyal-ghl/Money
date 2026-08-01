/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Mapbox public access token. Supplied via `.env.local` (git-ignored) and
   * never written into source. See `src/config/env.ts` for the only accessor.
   */
  readonly VITE_MAPBOX_TOKEN?: string;
  /**
   * Optional public Figma URL for the /handover microsite. Empty → no Open
   * Figma control. See `getFigmaUrl()` in `src/config/env.ts`.
   */
  readonly VITE_FIGMA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
