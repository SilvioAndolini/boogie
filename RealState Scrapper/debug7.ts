import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await ctx.newPage();

  // Intercept GraphQL
  page.on("request", async (req) => {
    if (req.url().includes("graphql")) {
      const postData = req.postData();
      if (postData) {
        const parsed = JSON.parse(postData);
        const opName = parsed.operationName;
        if (opName === "GetStay" || opName?.toLowerCase().includes("search") || opName?.toLowerCase().includes("stay")) {
          console.log(`\n=== REQ: ${opName} ===`);
          console.log("Full body:", postData?.slice(0, 2000));
        }
      }
    }
  });

  page.on("response", async (resp) => {
    if (resp.url().includes("graphql")) {
      try {
        const body = await resp.json();
        const str = JSON.stringify(body);
        if (str.length > 10) {
          console.log(`\n=== RESP (${str.length} chars) ===`);
          console.log(str.slice(0, 1500));
        }
      } catch {}
    }
  });

  // 1. Try a property that exists
  console.log("=== TEST 1: Property page ===");
  await page.goto(
    "https://estei.app/stay/17281517903060393862/profile?guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "domcontentloaded", timeout: 45000 }
  );
  await page.waitForTimeout(12000);

  // 2. Try the search page with interaction
  console.log("\n\n=== TEST 2: Search page with location input ===");
  await page.goto("https://estei.app/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Accept cookies
  try {
    const btn = page.locator('button:has-text("Aceptar")');
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
    await page.waitForTimeout(500);
  } catch {}

  // Type in the location search box
  const locInput = page.locator('input[placeholder="¿A dónde quieres ir?"]');
  await locInput.click();
  await locInput.fill("Caracas");
  await page.waitForTimeout(3000);

  // Take screenshot of autocomplete
  const suggestions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[class*="autocomplete"], [class*="suggestion"], [class*="prediction"], [role="listbox"] *, [class*="pac-"]')).map((el) => el.textContent?.trim()).filter(Boolean);
  });
  console.log("Autocomplete suggestions:", suggestions);

  // Click Caracas popular destination instead
  console.log("\nClicking Caracas destination link...");
  const caracas = page.locator("text=Caracas").first();
  await caracas.click();
  await page.waitForTimeout(2000);

  // Click search
  const searchBtn = page.locator('[role="button"], button').filter({ hasText: "Buscar" }).last();
  if (await searchBtn.isVisible({ timeout: 2000 })) {
    await searchBtn.click();
    console.log("Clicked search");
    await page.waitForTimeout(10000);
  }

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\nSearch results page text (first 2000):", bodyText.slice(0, 2000));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
