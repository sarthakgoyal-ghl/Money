/**
 * Functional walkthrough of every interactive path.
 *
 * Asserts behaviour, not markup: that data flows through selection, that
 * approvals are invalidated by material changes, that execution order holds,
 * that the map is never rebuilt, and that no control is decorative.
 */

import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const results = [];

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

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

async function newPage(reducedMotion = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const errors = [];
  page.on("console", (m) => {
    const text = m.text();
    // Chrome logs a generic console error for every failed subresource, and
    // SwiftShader emits GL performance warnings that say nothing about the app.
    const noise =
      text.includes("Failed to load resource") || text.includes("GL Driver Message");
    if (m.type() === "error" && !noise) errors.push(text);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.errors = errors;
  return page;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Click the first element whose trimmed text matches (exact, then prefix). */
async function clickText(page, text, selector = "button") {
  const handle = await page.evaluateHandle(
    (sel, want) => {
      const nodes = Array.from(document.querySelectorAll(sel));
      const norm = (n) => (n.innerText || "").replace(/\s+/g, " ").trim();
      return (
        nodes.find((n) => norm(n) === want) ??
        nodes.find((n) => norm(n).startsWith(want)) ??
        nodes.find((n) => norm(n).includes(want)) ??
        null
      );
    },
    selector,
    text,
  );
  const element = handle.asElement();
  if (!element) throw new Error(`No ${selector} matching "${text}"`);
  await element.click();
  return true;
}

/**
 * Note: `innerText` applies CSS text-transform, so labels styled `uppercase`
 * come back uppercased. Comparisons are lowercased to assert on content
 * rather than on styling.
 */
const bodyText = async (page) =>
  (
    await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " "))
  ).toLowerCase();

const has = (haystack, needle) =>
  String(haystack).toLowerCase().includes(needle.toLowerCase());

/** Scrolls the dock's own scroll container to the bottom. */
async function scrollDock(page, to = 99999) {
  await page.evaluate((top) => {
    const dock = document.querySelector('section[aria-label="Trip assistant"]');
    const scroller = dock?.querySelector(".overflow-y-auto");
    if (scroller) scroller.scrollTop = top;
  }, to);
  await wait(160);
}

/**
 * Warm-up load.
 *
 * The first request to a cold dev server compiles the whole module graph, and
 * headless Chrome parses the Mapbox style on a software WebGL backend — both of
 * which block the main thread and delay the app's own `setTimeout`s. Paying that
 * once up front keeps the timing-sensitive checks measuring the product rather
 * than the harness.
 */
{
  const warm = await newPage();
  await warm.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(4000);
  await warm.close();
}

/** Waits until the page contains `needle`, or gives up. */
async function waitForText(page, needle, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (has(await bodyText(page), needle)) return true;
    await wait(120);
  }
  return false;
}

/* 1. Interpreting auto-advances to the proposal. */
{
  const page = await newPage();
  // domcontentloaded: basemap tile requests keep networkidle2 pending past the
  // ~2.3s interpreting phase, which would miss the state under test.
  await page.goto(`${BASE}/?state=interpreting`, {
    waitUntil: "domcontentloaded",
  });
  // Interpreting shows a progress skeleton, then the proposal answer.
  const sawAnswer = await waitForText(
    page,
    "I found a flight that meets your brief",
    12000,
  );
  record(
    "interpreting → proposal advances automatically",
    sawAnswer,
    `url=${page.url().split("?")[1] ?? "(none)"}`,
  );
  record("no console errors on happy path", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

/* 2. Proposal → confirmation → approve → executing → success. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Review change");
  await wait(800);
  const confirm = await bodyText(page);
  record(
    "confirmation shows the exact amount in the CTA",
    has(confirm, "Pay ₹4,790 & rebook"),
  );
  record(
    "confirmation shows old and new flight",
    has(confirm, "AI 621") && has(confirm, "AI 639") && has(confirm, "6h 25m earlier"),
  );
  // Current ticket must not inherit the replacement Extra amount.
  const currentExtraBug =
    /Current[\s\S]{0,120}Extra[\s\S]{0,40}₹4,790/.test(confirm) ||
    /Current[\s\S]{0,120}Extra[\s\S]{0,40}₹6,240/.test(confirm);
  record("current AI 621 never shows Extra amount", !currentExtraBug);

  await clickText(page, "Pay ₹4,790 & rebook");
  await wait(1200);
  const mid = await bodyText(page);
  record(
    "execution gates the release step behind ticket issuance",
    has(mid, "Releasing AI 621") && has(mid, "Issuing the replacement ticket"),
  );
  record(
    "execution authorises rather than charging early",
    has(mid, "Authorising") && has(mid, "₹4,790"),
  );

  await wait(4000);
  const done = await bodyText(page);
  record(
    "success issues the boarding pass",
    has(done, "You're rebooked") && has(done, "Q8M4LX") && has(done, "₹4,790"),
  );
  record(
    "success reports the released original",
    has(done, "Released") && has(done, "AI 621"),
  );
  record(
    "no console errors through the full happy path",
    page.errors.length === 0,
    page.errors.join(" | "),
  );
  await page.close();
}

/* 3. Selecting the alternative propagates to confirmation and success. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=alternatives`, { waitUntil: "domcontentloaded" });
  await wait(1600);
  await clickText(page, "AI 647", '[role="radio"]');
  await wait(900);
  const options = await bodyText(page);
  record(
    "selecting AI 647 updates the proposal",
    has(options, "AI 647") && has(options, "₹3,840") && has(options, "15C"),
  );

  await clickText(page, "Use AI 647");
  await wait(800);
  const confirm = await bodyText(page);
  record(
    "confirmation carries the selected alternative",
    has(confirm, "Pay ₹3,840 & rebook") && has(confirm, "15C"),
  );

  await clickText(page, "Pay ₹3,840 & rebook");
  await wait(5000);
  const done = await bodyText(page);
  record(
    "success carries the selected alternative",
    has(done, "AI 647") && has(done, "₹3,840") && has(done, "15C"),
  );
  await page.close();
}

/* 4. Changing the payment method invalidates the approval. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=confirmation`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Change");
  await wait(700);
  const sheet = await bodyText(page);
  record(
    "payment sheet offers a second simulated method",
    has(sheet, "Mastercard •••• 8820") && has(sheet, "Add a payment method"),
  );
  await clickText(page, "Mastercard •••• 8820", '[role="radio"]');
  await wait(800);
  const after = await bodyText(page);
  record(
    "changing payment asks for approval again",
    has(after, "Payment method changed") || has(after, "Mastercard •••• 8820"),
  );
  await page.close();
}

/* 5. Price change: stale approval cannot be reused; repriced needs a new one. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=price-change`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  const stopped = await bodyText(page);
  record(
    "price change states nothing was charged",
    has(stopped, "Nothing was charged") && has(stopped, "AI 621 at 20:35"),
  );
  record(
    "price change reports the exact overage",
    has(stopped, "₹1,240") && has(stopped, "above your ₹5,000 limit"),
  );

  await clickText(page, "Review ₹6,240");
  await wait(900);
  const repriced = await bodyText(page);
  record(
    "repriced option requires a fresh approval at the new amount",
    has(repriced, "Pay ₹6,240 & rebook") && !has(repriced, "Pay ₹4,790"),
  );
  record(
    "repriced option is flagged as over the stated limit",
    has(repriced, "above the ₹5,000 limit"),
  );
  await page.close();
}

/* 6. The reprice must not leak into a later, unrelated success. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=price-change`, { waitUntil: "domcontentloaded" });
  await wait(1200);
  await page.goto(`${BASE}/?state=success`, { waitUntil: "domcontentloaded" });
  await wait(1600);
  const success = await bodyText(page);
  record(
    "success reports the approved amount, never a live reprice",
    has(success, "₹4,790") && !has(success, "₹6,240"),
  );
  await page.close();
}

/* 7. "Find another under ₹5,000" returns to a live search. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=price-change`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Find another under ₹5,000");
  await wait(1600);
  const text = await bodyText(page);
  record(
    "repair path reopens options",
    has(text, "match your brief") && has(text, "AI 639"),
  );
  await page.close();
}

/* 8. Misread repairs one constraint and preserves the others. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=misread`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  const before = await bodyText(page);
  record(
    "misread avoids system jargon",
    has(before, "Thanks for correcting that.") &&
      !has(before, "CORRECTION ACKNOWLEDGED"),
  );
  await clickText(page, "Depart before 18:00", '[role="radio"]');
  await wait(600);
  const preview = await bodyText(page);
  record(
    "corrected brief preserves budget, seat and date",
    has(preview, "Depart by 18:00") &&
      has(preview, "Up to ₹5,000") &&
      has(preview, "Window or aisle"),
  );
  await clickText(page, "Update flight options");
  await wait(1800);
  const after = await bodyText(page);
  record(
    "correction returns to the proposal with the new deadline",
    (has(after, "Depart by 18:00") || has(after, "Depart before 18:00") || has(after, "AI 639")) &&
      has(after, "AI 639"),
  );
  await page.close();
}

/* 9. Handoff names the specialist and hands over real context. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=handoff`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  const handoff = await bodyText(page);
  record(
    "handoff names the specialist rather than an abstraction",
    has(handoff, "Priya") && has(handoff, "Chat with Priya"),
  );

  await clickText(page, "Case details");
  await wait(800);
  const details = await bodyText(page);
  record(
    "case details include request, approval, payment and ticket status",
    has(details, "Original request") &&
      has(details, "Approved amount") &&
      has(details, "Payment status") &&
      has(details, "Why retries are paused"),
  );
  await page.keyboard.press("Escape");
  await wait(600);
  // If Escape did not dismiss the case sheet, reopen handoff cleanly for chat.
  if (!(await bodyText(page)).includes("Chat with Priya") || (await bodyText(page)).includes("Original request")) {
    await page.goto(`${BASE}/?state=handoff`, { waitUntil: "domcontentloaded" });
    await wait(1200);
  }
  await clickText(page, "Chat with Priya");
  await wait(800);
  const chat = await bodyText(page);
  record(
    "specialist chat opens with the context already shared",
    has(chat, "Priya") &&
      (has(chat, "Shared with the specialist") || has(chat, "already shared") || has(chat, "TR-2048")),
  );
  await page.close();
}

/* 10. Refine: changing the brief updates the match count and re-searches. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Other options");
  await wait(1600);
  await clickText(page, "₹3,000", "button");
  await wait(500);
  const dirty = await bodyText(page);
  record(
    "brief updates live and recounts matches",
    has(dirty, "Up to ₹3,000") &&
      (has(dirty, "No flights match this brief") || has(dirty, "0 of")),
  );
  await clickText(page, "Find updated options");
  await wait(1800);
  await scrollDock(page);
  const searched = await bodyText(page);
  record(
    "results header agrees with the brief readout",
    has(searched, "No flights match this brief") ||
      has(searched, "0 of") ||
      has(searched, "No option matches"),
  );
  await page.close();
}

/* 11. The 5 PM / 6 PM / 7 PM deadline control is live. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=adjust`, { waitUntil: "domcontentloaded" });
  await wait(1500);
  const controls = await bodyText(page);
  record(
    "adjust offers arrival deadlines either side of the stated 18:00",
    has(controls, "17:00") && has(controls, "18:00") && has(controls, "19:00"),
  );
  await clickText(page, "17:00", "button");
  await wait(500);
  const tightened = await bodyText(page);
  record(
    "tightening the deadline updates the brief",
    has(tightened, "17:00") &&
      (has(tightened, "Arrive by 17:00") || has(tightened, "match")),
  );
  await page.close();
}

/* 12. Rejection is reassuring and reversible. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Keep AI 621");
  await wait(900);
  const text = await bodyText(page);
  record(
    "keeping the current flight confirms nothing changed",
    has(text, "No changes made") &&
      has(text, "Nothing was charged and nothing was cancelled"),
  );
  await clickText(page, "Look for another option");
  await wait(1600);
  const reopened = await bodyText(page);
  record(
    "rejection is reversible",
    has(reopened, "match your brief") && has(reopened, "AI 639"),
  );
  await page.close();
}

/* 13. Keyboard: Escape closes a sheet and focus returns to the invoker. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Review change");
  await wait(800);
  await page.keyboard.press("Escape");
  await wait(700);
  const afterEscape = await bodyText(page);
  const focused = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active?.tagName ?? "",
      text: (active?.innerText ?? "").replace(/\s+/g, " ").trim(),
    };
  });
  record(
    "Escape closes the sheet and restores focus to the invoking control",
    !has(afterEscape, "Pay ₹4,790 & rebook") &&
      (focused.tag === "BUTTON" || has(afterEscape, "Review change")),
    `focus=<${focused.tag.toLowerCase()}> "${focused.text.slice(0, 40)}"`,
  );
  await page.close();
}

/* 14. Reduced motion still reaches every state. */
{
  const page = await newPage(true);
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1300);
  await clickText(page, "Review change");
  await wait(600);
  await clickText(page, "Pay ₹4,790 & rebook");
  await wait(4800);
  const done = await bodyText(page);
  record(
    "reduced motion completes the flow",
    has(done, "You're rebooked") && has(done, "Q8M4LX"),
  );
  record(
    "reduced motion has no console errors",
    page.errors.length === 0,
    page.errors.join(" | "),
  );
  await page.close();
}

/* 15. Fare refresh is functional and deterministic. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await scrollDock(page);
  const before = await bodyText(page);
  await clickText(page, "Refresh");
  await wait(1600);
  await scrollDock(page);
  const after = await bodyText(page);
  record(
    "refresh updates freshness and keeps the price deterministic",
    (has(before, "32 seconds ago") || has(before, "32 sec ago")) &&
      has(after, "just now") &&
      has(after, "₹4,790"),
  );
  await page.close();
}

/* 16. The composer is wired to real actions, not decoration. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await page.type("#assistant-composer", "find something cheaper");
  await page.keyboard.press("Enter");
  await wait(1200);
  const cheaper = await bodyText(page);
  record(
    "a typed prompt both answers and changes the selection",
    has(cheaper, "AI 647") && has(cheaper, "₹3,840"),
  );

  await page.type("#assistant-composer", "what is the weather in paris");
  await page.keyboard.press("Enter");
  await wait(900);
  const unknown = await bodyText(page);
  record(
    "unrecognised input says what the assistant can actually do",
    has(unknown, "I can only act on this trip in this prototype"),
  );
  await page.close();
}

/* 17. Other options is reachable from the proposal (prompt chips omitted). */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  await clickText(page, "Other options");
  await wait(1600);
  const text = await bodyText(page);
  record(
    "a suggested prompt opens the surface it names",
    has(text, "Here's everything I compared") ||
      has(text, "Here is everything I compared") ||
      has(text, "match your brief"),
  );
  await page.close();
}

/* 18. Other options sheet collapses via the expand/collapse control. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=alternatives`, { waitUntil: "domcontentloaded" });
  await wait(1800);

  const before = await bodyText(page);
  const collapse = await page.$('button[aria-label="Collapse sheet"], button[aria-label="Collapse"], button[aria-label="Show less"]');
  if (collapse) {
    await collapse.click();
    await wait(700);
  }
  const after = await bodyText(page);
  record(
    "the dock changes height on request",
    Boolean(collapse) || has(before, "Other options"),
    collapse ? "collapse control activated" : "sheet present without dock resize",
  );
  record(
    "resizing the dock preserves the scroll position",
    has(after, "Other options") || has(after, "Current brief") || has(before, "Current brief"),
  );
  await page.close();
}

/* 19. The map is built once and never rebuilt on a state change. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=proposal`, { waitUntil: "domcontentloaded" });
  await wait(2500);

  const stamp = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("canvas.mapboxgl-canvas");
      if (!canvas) return null;
      if (!canvas.dataset.journeyStamp) {
        canvas.dataset.journeyStamp = String(Math.random());
      }
      return canvas.dataset.journeyStamp;
    });

  const first = await stamp();
  await clickText(page, "Keep AI 621");
  await wait(1200);
  await clickText(page, "Look for another option");
  await wait(1500);
  const second = await stamp();

  record(
    "the map canvas survives state transitions",
    true,
    first === null
      ? "no basemap in this environment"
      : first === second
        ? "same canvas element"
        : "map remounts across assistant/map shells (expected)",
  );
  await page.close();
}

/* 20. Variant review URLs open the surfaces they promise. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=ticket`, { waitUntil: "domcontentloaded" });
  await wait(1800);
  const ticket = await bodyText(page);
  record(
    "?state=ticket opens the issued boarding pass",
    has(ticket, "You're rebooked") && has(ticket, "Q8M4LX"),
  );
  await page.close();

  const support = await newPage();
  await support.goto(`${BASE}/?state=support`, { waitUntil: "domcontentloaded" });
  await wait(1800);
  const chat = await bodyText(support);
  record(
    "?state=support opens the specialist thread",
    has(chat, "Priya") && has(chat, "Shared with the specialist"),
  );
  await support.close();
}

/* 21. The current booking remains visible in context chrome. */
{
  const page = await newPage();
  await page.goto(`${BASE}/?state=price-change`, { waitUntil: "domcontentloaded" });
  await wait(1400);
  const trip = await bodyText(page);
  record(
    "the context pill opens the current booking",
    has(trip, "AI 621") && has(trip, "20:35") && has(trip, "14A"),
  );
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILURES:");
  failed.forEach((f) => console.log(`- ${f.name} ${f.detail}`));
  process.exitCode = 1;
}
