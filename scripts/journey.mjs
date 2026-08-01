import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "screenshots/journey");
mkdirSync(outDir, { recursive: true });

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
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

async function snap(name, waitMs = 300) {
  await new Promise((r) => setTimeout(r, waitMs));
  await page.screenshot({
    path: resolve(outDir, `${name}.png`),
    fullPage: false,
  });
  console.log(`  snap ${name}`);
}

// Step 1: interpreting -> proposal
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await snap("01-interpreting", 200);
await snap("02-proposal-arrived", 2200);

// Step 2: open confirmation
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent?.trim() === "Review change");
  btn?.click();
});
await snap("03-confirmation-open", 500);

// Step 3: approve -> executing
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent?.trim().startsWith("Pay ₹4,790"));
  btn?.click();
});
await snap("04-executing", 300);
await snap("05-executing-mid", 1400);
await snap("06-success", 2000);

// Step 4: adjust flow
await page.goto("http://localhost:5173/?state=proposal", {
  waitUntil: "networkidle0",
});
await snap("07-proposal", 300);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent?.trim() === "See other options");
  btn?.click();
});
await snap("08-adjust-open", 500);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent?.trim() === "Update options");
  btn?.click();
});
await snap("09-alternatives-listed", 1400);

// Step 5: reject
await page.goto("http://localhost:5173/?state=proposal", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const btn = btns.find((b) => b.textContent?.trim() === "Keep current flight");
  btn?.click();
});
await snap("10-rejected", 400);

// Step 6: misread selection
await page.goto("http://localhost:5173/?state=misread", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('[role="radio"]'));
  const btn = btns.find((b) => b.textContent?.includes("Depart before"));
  btn?.click();
});
await snap("11-misread-selected", 300);

// Step 7: demo menu
await page.goto("http://localhost:5173/?state=proposal", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const btn = document.querySelector('[aria-label="More"]');
  btn?.click();
});
await snap("12-demo-menu-open", 200);

console.log("Console errors:", consoleErrors.length);
consoleErrors.forEach((e) => console.log("  " + e));

await browser.close();
