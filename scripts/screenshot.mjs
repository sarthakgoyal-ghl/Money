import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const outDir = resolve(process.cwd(), "screenshots");
mkdirSync(outDir, { recursive: true });

const states = [
  { slug: "proposal", wait: 400 },
  { slug: "confirmation", wait: 500 },
  { slug: "executing", wait: 1200 },
  { slug: "success", wait: 400 },
  { slug: "price-change", wait: 400 },
  { slug: "misread", wait: 400 },
  { slug: "handoff", wait: 400 },
  { slug: "rejected", wait: 400 },
  { slug: "alternatives", wait: 800 },
];

const viewports = [
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 },
  { name: "desktop", width: 1280, height: 900, deviceScaleFactor: 1.5 },
];

const browser = await puppeteer.launch({
  headless: true,
  // puppeteer is installed without a bundled browser; use a local Chrome.
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});

for (const vp of viewports) {
  for (const s of states) {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    await page.setViewport(vp);
    const url = `${BASE}/?state=${s.slug}`;
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
    } catch (e) {
      console.error(`goto failed for ${url}: ${String(e)}`);
    }
    await new Promise((r) => setTimeout(r, s.wait));
    const filename = resolve(outDir, `${vp.name}-${s.slug}.png`);
    await page.screenshot({ path: filename, fullPage: false });
    if (consoleErrors.length > 0) {
      console.error(`Console errors for ${vp.name}/${s.slug}:`);
      consoleErrors.forEach((e) => console.error("  " + e));
    } else {
      console.log(`ok  ${vp.name}/${s.slug} -> ${filename}`);
    }
    await page.close();
  }
}

await browser.close();
