import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { HandoverPage } from "./handover/HandoverPage";
import { prefetchMapbox } from "./config/prefetchMapbox";
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
 * documentation lives at `/handover` without pulling in a router dependency.
 */
function pathIsHandover(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/handover";
}

const isHandover = pathIsHandover();
// Start the Mapbox vendor chunk while React mounts the shell.
if (!isHandover) prefetchMapbox();

createRoot(rootEl).render(
  <StrictMode>
    {isHandover ? <HandoverPage /> : <App />}
  </StrictMode>,
);
