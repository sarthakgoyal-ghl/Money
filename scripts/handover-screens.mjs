/**
 * Capture final prototype screens into public/handover/screens as WebP.
 * Requires Vite on BASE_URL (default http://127.0.0.1:5173).
 *
 * Usage: node scripts/handover-screens.mjs
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const outDir = resolve(process.cwd(), "public/handover/screens");
mkdirSync(outDir, { recursive: true });

const DEVICE = { width: 1280, height: 900, deviceScaleFactor: 2 };

/** @type {{ file: string, slug: string, wait?: number, after?: Function }[]} */
const shots = [
  { file: "assistant", slug: "interpreting", wait: 1100 },
  { file: "proposal", slug: "proposal", wait: 1400 },
  { file: "alternatives", slug: "alternatives", wait: 1100 },
  { file: "confirmation", slug: "confirmation", wait: 900 },
  {
    file: "payment-method",
    slug: "confirmation",
    wait: 700,
    after: async (page) => {
      try {
        await page.locator("button ::-p-text(Change)").click({ timeout: 4000 });
      } catch {
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find(
            (el) => (el.textContent || "").trim() === "Change",
          );
          btn?.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
          );
        });
      }
      await new Promise((r) => setTimeout(r, 1100));
    },
  },
  { file: "executing", slug: "executing", wait: 1500 },
  { file: "success", slug: "success", wait: 1000 },
  { file: "boarding-pass", slug: "ticket", wait: 1000 },
  { file: "price-changed", slug: "price-change", wait: 900 },
  {
    file: "higher-price-confirmation",
    slug: "price-change",
    wait: 800,
    after: async (page) => {
      await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll("button"));
        const target = nodes.find((el) =>
          /6,?240|approve ₹|pay ₹6/i.test(el.textContent ?? ""),
        );
        if (target instanceof HTMLElement) target.click();
      });
      await new Promise((r) => setTimeout(r, 900));
    },
  },
  { file: "misread", slug: "misread", wait: 900 },
  { file: "handoff", slug: "handoff", wait: 900 },
  { file: "specialist", slug: "support", wait: 1000 },
  {
    file: "case-details",
    slug: "handoff",
    wait: 800,
    after: async (page) => {
      try {
        await page.locator("button ::-p-text(Case details)").click({ timeout: 4000 });
      } catch {
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find((el) =>
            /case details/i.test(el.textContent ?? ""),
          );
          btn?.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
          );
        });
      }
      await new Promise((r) => setTimeout(r, 1100));
    },
  },
  { file: "kept-current", slug: "rejected", wait: 800 },
];

const browser = await puppeteer.launch({
  headless: true,
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

for (const shot of shots) {
  const page = await browser.newPage();
  await page.setViewport(DEVICE);
  const url = `${BASE}/?state=${shot.slug}`;
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
  } catch (error) {
    console.error(`goto failed ${url}: ${String(error)}`);
  }
  await new Promise((r) => setTimeout(r, shot.wait ?? 700));

  await page.evaluate(() => {
    const close = Array.from(document.querySelectorAll("button")).find((el) =>
      /^close$/i.test((el.textContent ?? "").trim()),
    );
    if (close instanceof HTMLElement) close.click();
  });

  if (shot.after) await shot.after(page);

  const webpPath = resolve(outDir, `${shot.file}.webp`);
  const frame = await page.$(
    ".md\\:rounded-fig-device, [class*='rounded-fig-device']",
  );

  if (frame) {
    await frame.screenshot({ path: webpPath, type: "webp", quality: 84 });
  } else {
    await page.screenshot({ path: webpPath, type: "webp", quality: 84 });
  }
  console.log(`ok  ${shot.file}.webp`);
  await page.close();
}

await browser.close();
console.log(`Wrote ${shots.length} screens to ${outDir}`);
