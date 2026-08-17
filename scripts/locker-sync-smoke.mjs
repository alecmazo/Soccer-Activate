import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8080";
const shot = process.argv[3] || "/workspace/screenshots/locker-sync.png";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(`${base.replace(/\/$/, "")}/videos`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const clip = "https://x.com/ActivateTest/status/1987654321098765432";
await page.locator("textarea").first().fill(clip);
await page.getByRole("button", { name: /link video/i }).click();
await page.waitForTimeout(300);

const bodyBefore = await page.locator("body").innerText();
if (!bodyBefore.includes("ActivateTest") && !bodyBefore.includes("1987654321098765432")) {
  throw new Error("linked clip did not appear");
}

await page.getByRole("button", { name: /use on other devices/i }).click();
await page.waitForTimeout(2500);

const href = await page.evaluate(() => {
  const el = document.querySelector("p.break-all");
  return el?.textContent?.trim() ?? "";
});
if (!href.includes("locker=")) {
  await page.screenshot({ path: shot, fullPage: true });
  throw new Error(`locker link missing: ${href.slice(0, 180)}`);
}

await context.clearCookies();
await page.evaluate(() => localStorage.clear());
await page.goto(href, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: shot, fullPage: true });

const bodyAfter = await page.locator("body").innerText();
const restored =
  bodyAfter.includes("ActivateTest") || bodyAfter.includes("1987654321098765432");
await browser.close();

if (!restored) {
  throw new Error("locker link did not restore clips on a fresh device");
}
if (errors.some((e) => /uncaught|invariant|failed to fetch dynamically/i.test(e))) {
  throw new Error(errors.join("\n"));
}

console.log(
  JSON.stringify({ ok: true, href: href.slice(0, 160), errors, screenshot: shot }, null, 2),
);
