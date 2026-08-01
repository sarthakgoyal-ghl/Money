import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // mapbox-gl is a single ~1.9 MB vendor library. It is already isolated into
    // its own chunk and dynamically imported, so it never touches the initial
    // load — the app bundle stays small and the basemap is fetched only when a
    // token is configured. It cannot be split further, so the default 500 kB
    // warning is not actionable here.
    chunkSizeWarningLimit: 2000,
  },
});
