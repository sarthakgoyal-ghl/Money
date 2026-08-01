/**
 * Prints the geometry of every sheet/overlay for one demo state.
 *
 * Screenshots only show what is painted; this shows what exists and where, which
 * is what separates "the sheet did not render" from "the sheet rendered offscreen".
 *
 * Usage: node scripts/probe-state.mjs alternatives
 */
import puppeteer from "puppeteer";

const state = process.argv[2] ?? "alternatives";
const url = `http://localhost:5173/?state=${state}`;

const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 2 });

const problems = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") {
    problems.push(`${m.type()}: ${m.text()}`);
  }
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

const report = await page.evaluate(() => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""),
      label: el.getAttribute("aria-label") ?? el.getAttribute("role") ?? "",
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      height: Math.round(r.height),
      width: Math.round(r.width),
      opacity: cs.opacity,
      display: cs.display,
      visibility: cs.visibility,
      transform: cs.transform === "none" ? "none" : cs.transform,
      zIndex: cs.zIndex,
    };
  };

  // A sheet pinned with `bottom-0` that lands offscreen is an ancestor problem,
  // so walk up recording who actually establishes the containing block.
  const chain = (el) => {
    const out = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      out.push({
        tag: n.tagName + (n.className ? "." + String(n.className).split(" ").slice(0, 3).join(".") : ""),
        position: cs.position,
        display: cs.display,
        top: Math.round(r.top),
        height: Math.round(r.height),
        overflow: cs.overflow,
      });
    }
    return out;
  };

  const sheet = document.querySelector(".fig-sheet");
  return {
    sheets: [...document.querySelectorAll(".fig-sheet")].map(box),
    dialogs: [...document.querySelectorAll('[role="dialog"]')].map(box),
    sheetAncestors: sheet ? chain(sheet) : [],
    text: (document.body.innerText || "").slice(0, 600),
  };
});

console.log(`--- ${state} ---`);
console.log(JSON.stringify(report, null, 2));
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no console problems");

await browser.close();
