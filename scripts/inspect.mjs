import puppeteer from "puppeteer";

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
await page.goto("http://localhost:5173/?state=alternatives", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 1000));

const info = await page.evaluate(() => {
  const sheet = document.querySelector('[role="dialog"]');
  if (!sheet) return { found: false };
  const motion = sheet.querySelector('div[style*="transform"]') ||
    sheet.querySelectorAll("div")[2];
  const rect = motion.getBoundingClientRect();
  const html = motion.outerHTML.slice(0, 400);
  const children = Array.from(motion.children).map((c) => {
    const r = c.getBoundingClientRect();
    return {
      class: c.className,
      rect: { top: r.top, bottom: r.bottom, height: r.height },
      textPreview: (c.textContent || "").slice(0, 60),
    };
  });
  return {
    found: true,
    sheetRect: {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      width: rect.width,
    },
    computedHeight: getComputedStyle(motion).height,
    computedOverflow: getComputedStyle(motion).overflow,
    html,
    children,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
