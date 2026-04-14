import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17273652068679158460/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="three-dots-loading"]')?.isConnected, { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // Extract raw lines
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
    return { totalLines: lines.length, lines: lines };
  });

  console.log(`Total lines: ${result.totalLines}\n`);
  result.lines.forEach((l: string, i: number) => {
    console.log(`${i}: ${l}`);
  });

  await browser.close();
})().catch(console.error);
