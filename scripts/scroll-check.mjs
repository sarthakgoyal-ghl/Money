import puppeteer from "puppeteer";
import { resolve } from "node:path";

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
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/?state=confirmation", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 700));

const info = await page.evaluate(() => {
  const scrollables = document.querySelectorAll(".no-scrollbar");
  return Array.from(scrollables).map((el) => ({
    className: el.className,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    scrollTop: el.scrollTop,
  }));
});
console.log(JSON.stringify(info, null, 2));

await page.evaluate(() => {
  const scrollables = document.querySelectorAll(".no-scrollbar");
  scrollables[scrollables.length - 1]?.scrollTo({ top: 9999 });
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({
  path: resolve(process.cwd(), "screenshots/mobile-confirmation-scrolled.png"),
});

const text = await page.evaluate(() => document.body.innerText);
const keyPhrases = [
  "After you approve",
  "Bounded approval",
  "You're approving only AI 639",
  "View fare conditions",
];
console.log("Presence check:");
for (const p of keyPhrases) {
  console.log(`  ${text.includes(p) ? "PRESENT" : "MISSING"}: ${p}`);
}

await browser.close();
console.log("done");
