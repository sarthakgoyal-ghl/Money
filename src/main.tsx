import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { HandoverPage } from "./handover/HandoverPage";
import { WebPage } from "./web/WebPage";
import { prefetchMapbox } from "./config/prefetchMapbox";
import { resolveAppPath, shouldPrefetchMapbox } from "./pathRoute";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found in index.html");
}

/**
 * Lightweight path routing — prototype stays at `/` with `?state=` deep links;
 * `/handover` is assignment docs; `/web` is the portfolio product site.
 */
const appPath = resolveAppPath(window.location.pathname);
if (shouldPrefetchMapbox(window.location.pathname)) prefetchMapbox();

createRoot(rootEl).render(
  <StrictMode>
    {appPath === "handover" ? (
      <HandoverPage />
    ) : appPath === "web" ? (
      <WebPage />
    ) : (
      <App />
    )}
  </StrictMode>,
);
