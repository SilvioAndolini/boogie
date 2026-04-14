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
  const gqlRequests: { op: string; body: string }[] = [];

  page.on("request", (req) => {
    if (req.url().includes("graphql")) {
      const data = req.postData() || "";
      gqlRequests.push({ op: JSON.parse(data).operationName || "?", body: data });
    }
  });

  page.on("response", async (resp) => {
    if (resp.url().includes("graphql")) {
      try {
        const body = JSON.stringify(await resp.json());
        if (body.length > 20) {
          console.log(`\nGQL RESP (${body.length}): ${body.slice(0, 1500)}`);
        }
      } catch {}
    }
  });

  // Go to search page directly with URL params and try to interact
  await page.goto(
    "https://estei.app/search?location=Caracas&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  // Try filling the location input
  console.log("Looking for location input...");
  const locInput = page.locator('input[placeholder*="dónde"], input[placeholder*="donde"]').first();
  if (await locInput.isVisible({ timeout: 3000 })) {
    console.log("Found location input, typing Caracas...");
    await locInput.click();
    await locInput.fill("Caracas Venezuela");
    await page.waitForTimeout(2000);

    // Check for Google Places autocomplete dropdown
    const pacItems = await page.evaluate(() => {
      const items = document.querySelectorAll(".pac-item, [class*='pac-container'] *");
      return Array.from(items).map((el) => el.textContent?.trim());
    });
    console.log("Places autocomplete items:", pacItems);

    if (pacItems.length > 0) {
      // Click first suggestion
      const firstItem = page.locator(".pac-item").first();
      await firstItem.click();
      await page.waitForTimeout(1000);
    } else {
      // Try pressing Enter or Tab
      await locInput.press("ArrowDown");
      await page.waitForTimeout(500);
      await locInput.press("Enter");
      await page.waitForTimeout(2000);
    }
  } else {
    console.log("No location input found on search page");
  }

  // Click search button
  const searchBtn = page.locator('button:has-text("Buscar")').last();
  if (await searchBtn.isVisible({ timeout: 3000 })) {
    console.log("Clicking search...");
    await searchBtn.click();
    await page.waitForTimeout(8000);
  }

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\nPage text:", bodyText.slice(0, 1500));

  // Also try: go to home, click Margarita, set dates, search
  console.log("\n\n=== TRY 2: Full flow from home ===");
  gqlRequests.length = 0;
  await page.goto("https://estei.app/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Accept cookies
  try {
    const btn = page.locator('button:has-text("Aceptar")');
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
    await page.waitForTimeout(500);
  } catch {}

  // Click on "Margarita" destination
  const margLink = page.locator("text=Margarita").first();
  await margLink.click();
  await page.waitForTimeout(1000);

  // Set arrival date (April 14)
  console.log("Setting dates...");
  const arrivalInput = page.locator('input[placeholder*="Llegada"], input[placeholder*="DD/MM"]').first();
  if (await arrivalInput.isVisible({ timeout: 2000 })) {
    await arrivalInput.click();
    await page.waitForTimeout(500);
    // Click on April 14
    const day14 = page.locator('text=14').first();
    await day14.click();
    await page.waitForTimeout(500);
    // Click on April 15
    const day15 = page.locator('text=15').first();
    await day15.click();
    await page.waitForTimeout(500);
  }

  // Click the search button with icon
  const searchBtn2 = page.locator('button >> svg').first();
  const searchBtn3 = page.locator('button:has-text("Buscar")').last();
  if (await searchBtn3.isVisible({ timeout: 2000 })) {
    console.log("Clicking search...");
    await searchBtn3.click();
    await page.waitForTimeout(10000);
  }

  console.log("\n=== All GQL Requests ===");
  for (const r of gqlRequests) {
    console.log(`  ${r.op}: ${r.body.slice(0, 200)}`);
  }

  const stayLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
  );
  console.log("\nStay links:", stayLinks.length);
  stayLinks.slice(0, 20).forEach((l) => console.log("  ", l));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
