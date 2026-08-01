/**
 * Practical WCAG AA checks across every state.
 *
 * Computes real contrast ratios from rendered colours (walking up for the
 * effective background), verifies keyboard reachability and focus visibility,
 * checks 200% zoom does not break layout, and confirms live regions exist where
 * status changes are announced.
 */

import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
// e.g. EXTRA_QUERY=basemap=off to exercise the offline SVG canvas.
const EXTRA = process.env.EXTRA_QUERY ? `&${process.env.EXTRA_QUERY}` : "";
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

const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CONTRAST_SCRIPT = () => {
  const parseColour = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  };

  const channel = (component) => {
    const c = component / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const luminance = ({ r, g, b }) =>
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  /**
   * Effective background: composite every translucent ancestor onto the base.
   *
   * Elements inside a `[data-on-dark]` subtree float over the map, which is a
   * sibling canvas rather than an ancestor background — so the base is the night
   * surface colour, not whatever is painted behind it.
   */
  const NIGHT = { r: 7, g: 11, b: 18, a: 1 };
  const PAGE = { r: 5, g: 7, b: 12, a: 1 };

  const effectiveBackground = (element) => {
    const onDark = Boolean(element.closest("[data-on-dark]"));
    const layers = [];
    let node = element;
    while (node && node !== document.documentElement) {
      if (onDark && node.hasAttribute?.("data-on-dark")) break;
      const bg = parseColour(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) layers.push(bg);
      node = node.parentElement;
    }
    let result = onDark ? { ...NIGHT } : { ...PAGE };
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      result = blend(layers[i], result);
    }
    return result;
  };

  const ratio = (fg, bg) => {
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (light + 0.05) / (dark + 0.05);
  };

  const findings = [];

  const nodes = Array.from(
    document.querySelectorAll(
      "p, span, h1, h2, h3, dt, dd, li, button, label, legend, th, td, a",
    ),
  );

  for (const node of nodes) {
    // Only leaf text nodes, and skip anything visually hidden.
    const ownText = Array.from(node.childNodes)
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent.trim())
      .join(" ")
      .trim();
    if (!ownText) continue;

    const style = getComputedStyle(node);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (Number(style.opacity) < 0.15) continue;

    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    // sr-only
    if (rect.width <= 1 && rect.height <= 1) continue;

    const fg = parseColour(style.color);
    if (!fg) continue;

    const bg = effectiveBackground(node);
    const composited = blend(fg, bg);
    const contrast = ratio(composited, bg);

    const fontSize = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
    const required = isLarge ? 3 : 4.5;

    if (contrast + 0.05 < required) {
      findings.push({
        text: ownText.slice(0, 44),
        contrast: Math.round(contrast * 100) / 100,
        required,
        fontSize,
        weight,
        color: style.color,
      });
    }
  }

  return findings;
};

for (const state of STATES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  // Time-limited states advance on their own, and basemap tile requests keep
  // `networkidle2` pending past them.
  const transient = state === "interpreting" || state === "executing";
  await page.goto(`${BASE}/?state=${state}${EXTRA}`, {
    waitUntil: transient ? "domcontentloaded" : "networkidle2",
  });
  await wait(state === "interpreting" ? 700 : transient ? 1400 : 1400);

  /* Contrast. */
  const contrastFindings = await page.evaluate(CONTRAST_SCRIPT);
  const unique = new Map();
  contrastFindings.forEach((f) => unique.set(`${f.text}|${f.contrast}`, f));
  if (unique.size) {
    problems.push(
      `${state}: contrast → ${[...unique.values()]
        .map((f) => `"${f.text}" ${f.contrast}:1 (needs ${f.required}, ${f.fontSize}px/${f.weight})`)
        .join("; ")}`,
    );
  }

  /* Keyboard reachability + visible focus. */
  const keyboard = await page.evaluate(() => {
    const focusable = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    )
      .filter((el) => el.getBoundingClientRect().height > 0)
      .filter((el) => !el.closest(".mapboxgl-ctrl"));
    return { count: focusable.length };
  });

  let focusVisible = true;
  for (let i = 0; i < Math.min(keyboard.count, 12); i += 1) {
    await page.keyboard.press("Tab");
    const ok = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return true;
      const style = getComputedStyle(el);
      // A visible ring is either an outline or a box-shadow ring.
      return (
        style.outlineStyle !== "none" ||
        style.boxShadow !== "none" ||
        el.matches(":focus-visible") === false
      );
    });
    if (!ok) focusVisible = false;
  }
  if (!focusVisible) problems.push(`${state}: a focused control had no visible ring`);
  if (keyboard.count === 0) problems.push(`${state}: no keyboard-focusable controls`);

  /* Live regions where status changes. */
  const live = await page.evaluate(
    () => document.querySelectorAll("[aria-live]").length,
  );
  if (["interpreting", "executing"].includes(state) && live === 0) {
    problems.push(`${state}: no aria-live region for status updates`);
  }

  /* The map carries a text alternative describing the route and its state.
     It is a WebGL canvas host when Mapbox is live and an <svg> in the offline
     fallback, so the check is on the labelled role rather than the tag. */
  const routeLabel = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[role="img"][aria-label]'));
    const map = nodes.find((n) => /route/i.test(n.getAttribute("aria-label") ?? ""));
    return map?.getAttribute("aria-label") ?? null;
  });
  if (!routeLabel) problems.push(`${state}: the map has no text alternative`);

  /* 200% zoom must not break layout. */
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await wait(400);
  const zoom = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (zoom.overflow > 2) {
    problems.push(`${state}: horizontal overflow ${zoom.overflow}px at 200% zoom`);
  }

  console.log(
    `${state.padEnd(14)} focusable=${String(keyboard.count).padStart(2)} live=${live} contrast-issues=${unique.size} zoom-overflow=${zoom.overflow}`,
  );
  await page.close();
}

await browser.close();

console.log("\n=== A11Y PROBLEMS ===");
if (problems.length === 0) {
  console.log("none");
} else {
  problems.forEach((p) => console.log(`- ${p}`));
  process.exitCode = 1;
}
