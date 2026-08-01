/**
 * Captures the Assistant thread at Figma's exact 402 × 874 frame, with the
 * device chrome suppressed, so it can be diffed against `1204:80683` directly.
 *
 * Also reports the measured geometry of the pieces the frame is specified by —
 * bubble widths, insets and the bottom chrome — because eyeballing a screenshot
 * cannot tell a 300 px bubble from a 320 px one, and that difference is exactly
 * what makes the thread stop reading as a conversation.
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const outDir = resolve(process.cwd(), "screenshots");
mkdirSync(outDir, { recursive: true });

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

const problems = [];
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  if (msg.type() === "warning" && /mapbox|source|layer|image/i.test(msg.text())) {
    problems.push(`warn: ${msg.text()}`);
  }
});
page.on("pageerror", (err) => problems.push(`pageerror: ${String(err)}`));
page.on("requestfailed", (req) =>
  problems.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`),
);

await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 2 });
await page.goto(`${BASE}/?state=proposal`, {
  waitUntil: "networkidle0",
  timeout: 30000,
});
await new Promise((r) => setTimeout(r, 1800));

const measured = await page.evaluate(() => {
  const root = document.querySelector("#root");
  const frameLeft = root.getBoundingClientRect().left;
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      left: +(r.left - frameLeft).toFixed(2),
      right: +(r.right - frameLeft).toFixed(2),
      width: +r.width.toFixed(2),
      height: +r.height.toFixed(2),
    };
  };

  const bubbles = [...document.querySelectorAll('[class*="rounded-[16px]"]')]
    .filter((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      return (
        bg === "rgb(233, 233, 235)" ||
        bg === "rgb(0, 120, 255)" ||
        bg === "rgb(0, 136, 255)"
      );
    })
    .map((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      ...box(el),
      text: (el.textContent ?? "").trim().slice(0, 34),
    }));

  const overflowing = [...document.querySelectorAll("*")]
    .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
    .filter((el) => !el.className.toString().includes("no-scrollbar"))
    .map((el) => `${el.tagName}.${el.className.toString().slice(0, 60)}`);

  return {
    nav: box(document.querySelector("header")),
    composer: box(document.querySelector("#assistant-composer")?.closest("form")),
    bubbles,
    overflowing: overflowing.slice(0, 6),
  };
});

console.log(JSON.stringify(measured, null, 2));
console.log(
  problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no console/network problems",
);

await page.screenshot({
  path: resolve(outDir, "thread-402x874.png"),
  fullPage: false,
});

// The top of the thread — the request, the activity line and the read-back —
// is above the fold once the answer scrolls into view, so it needs its own shot.
await page.evaluate(() => {
  const scroller = document.querySelector(".no-scrollbar.absolute.inset-0");
  if (scroller) scroller.scrollTop = 0;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({
  path: resolve(outDir, "thread-402x874-top.png"),
  fullPage: false,
});
await page.close();
await browser.close();
