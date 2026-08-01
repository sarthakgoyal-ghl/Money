/**
 * Visual + functional verification of every deterministic state.
 *
 * Captures each `?state=` slug at the mobile target, a short mobile height and
 * desktop, and reports console errors, page errors, and horizontal overflow.
 *
 *   node scripts/verify.mjs            # all viewports
 *   node scripts/verify.mjs mobile     # one viewport
 */

import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
// e.g. EXTRA_QUERY=basemap=off to exercise the offline SVG canvas.
const EXTRA = process.env.EXTRA_QUERY ? `&${process.env.EXTRA_QUERY}` : "";
const OUT = "screenshots";

const STATES = [
  "interpreting",
  "proposal",
  "adjust",
  "alternatives",
  "confirmation",
  "executing",
  "success",
  "ticket",
  "price-change",
  "misread",
  "handoff",
  "support",
  "rejected",
];

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2 },
  short: { width: 360, height: 640, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 900, deviceScaleFactor: 1 },
};

const only = process.argv[2];
const viewports = only
  ? { [only]: VIEWPORTS[only] }
  : VIEWPORTS;

await mkdir(OUT, { recursive: true });

// Prefer a locally installed Chrome so the script works without downloading a
// bundled browser. Override with CHROME_PATH if needed.
const executablePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    // Software WebGL so the Mapbox basemap actually renders headlessly.
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});

const problems = [];

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const state of STATES) {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    const consoleErrors = [];
    const consoleWarnings = [];
    const networkNotes = [];
    page.on("console", (message) => {
      const type = message.type();
      const text = message.text();
      // Chrome logs a generic console error for every failed subresource; the
      // requestfailed handler already classifies basemap fetches.
      const isResourceFailure = text.includes("Failed to load resource");
      if (type === "error" && !isResourceFailure) consoleErrors.push(text);
      else if (type === "error") networkNotes.push(text);
      if (type === "warning") consoleWarnings.push(text);
    });
    page.on("pageerror", (error) =>
      consoleErrors.push(`pageerror: ${error.message}`),
    );
    page.on("requestfailed", (request) => {
      // Tile/style fetch failures are environmental, not application defects —
      // the canvas already falls back when the basemap cannot load. Recorded
      // separately so they are visible without failing the run.
      const url = request.url();
      if (url.includes("mapbox")) networkNotes.push(request.failure()?.errorText ?? "failed");
    });

    // `interpreting` (~2.3s) and `executing` (~3.2s) advance on their own, and
    // basemap tile requests keep `networkidle2` pending past both — so these are
    // captured from domcontentloaded with a fixed mid-sequence delay.
    const transient = state === "interpreting" || state === "executing";
    await page.goto(`${BASE}/?state=${state}${EXTRA}`, {
      waitUntil: transient ? "domcontentloaded" : "networkidle2",
    });
    await new Promise((resolve) =>
      setTimeout(resolve, state === "interpreting" ? 900 : transient ? 1500 : 1400),
    );

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const horizontalOverflow = doc.scrollWidth - doc.clientWidth;

      // Content wider than the viewport is a layout bug. Decorative layers
      // (glows, map SVGs) are intentionally oversized and clipped, so they are
      // excluded — `horizontalOverflow` is the real guard for those.
      const wide = Array.from(document.querySelectorAll("*"))
        .filter((element) => {
          if (element.closest("svg")) return false;
          if (element.getAttribute("aria-hidden") === "true") return false;
          if (String(element.className).includes("pointer-events-none")) return false;
          // Basemap canvas is clipped and resizes a frame after re-parenting.
          if (element.closest(".mapboxgl-map")) return false;
          if (element.tagName === "CANVAS") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > window.innerWidth + 2 && rect.height > 0;
        })
        .slice(0, 4)
        .map((element) => `${element.tagName}.${String(element.className).slice(0, 60)}`);

      // Controls smaller than the 44px touch target.
      const small = Array.from(
        document.querySelectorAll('button, [role="radio"], [role="switch"], a[href]'),
      )
        .filter((element) => {
          // Mapbox's attribution/logo controls are vendor-required chrome, not
          // product controls, and cannot be resized without breaching terms.
          if (element.closest(".mapboxgl-ctrl")) return false;
          const rect = element.getBoundingClientRect();
          return rect.height > 0 && rect.height < 43.5;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return `${(element.textContent || element.getAttribute("aria-label") || "?").trim().slice(0, 34)} (${Math.round(rect.height)}px)`;
        });

      return {
        horizontalOverflow,
        wide,
        small: Array.from(new Set(small)),
        title: document.title,
        bodyText: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 600),
      };
    });

    await page.screenshot({
      path: `${OUT}/${viewportName}-${state}.png`,
      fullPage: false,
    });

    // The confirmation sheet is the crux of the assignment and taller than the
    // viewport, so capture the lower half too.
    if (state === "confirmation" && viewportName === "mobile") {
      await page.evaluate(() => {
        const scroller = document.querySelector(
          '[role="dialog"] .overflow-y-auto',
        );
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await page.screenshot({
        path: `${OUT}/${viewportName}-confirmation-scrolled.png`,
        fullPage: false,
      });
    }

    const label = `${viewportName}/${state}`;
    if (consoleErrors.length) problems.push(`${label}: console errors → ${consoleErrors.join(" | ")}`);
    if (consoleWarnings.length) problems.push(`${label}: warnings → ${consoleWarnings.join(" | ")}`);
    if (audit.horizontalOverflow > 0)
      problems.push(`${label}: horizontal overflow ${audit.horizontalOverflow}px`);
    if (audit.wide.length) problems.push(`${label}: oversized → ${audit.wide.join(", ")}`);
    if (audit.small.length) problems.push(`${label}: small targets → ${audit.small.join(", ")}`);
    if (networkNotes.length) {
      console.log(`   note: ${networkNotes.length} basemap fetch issue(s) — canvas falls back`);
    }

    console.log(
      `${label.padEnd(24)} ok=${consoleErrors.length === 0 && audit.horizontalOverflow === 0 && audit.small.length === 0}`,
    );
    if (viewportName === "mobile") {
      console.log(`   text: ${audit.bodyText.slice(0, 240)}`);
    }

    await page.close();
  }
}

await browser.close();

console.log("\n=== PROBLEMS ===");
if (problems.length === 0) {
  console.log("none");
} else {
  problems.forEach((problem) => console.log(`- ${problem}`));
  process.exitCode = 1;
}
