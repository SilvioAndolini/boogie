import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();

  // Capture the ACTUAL searchStays query that the site sends
  page.on("request", (req) => {
    if (req.url().includes("graphql") && req.method() === "POST") {
      const data = req.postData();
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.operationName?.includes("earch") || parsed.operationName?.includes("tay")) {
          console.log(`\n*** CAPTURED: ${parsed.operationName} ***`);
          console.log("Full request body:", data);
        }
      }
    }
  });

  page.on("response", async (resp) => {
    if (resp.url().includes("graphql")) {
      try {
        const body = JSON.stringify(await resp.json());
        if (body.length > 20 && body.length < 5000) {
          console.log(`\nRESPONSE: ${body.slice(0, 2000)}`);
        }
      } catch {}
    }
  });

  // Load search page
  console.log("Loading search page...");
  await page.goto(
    "https://estei.app/search?location=Caracas&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await new Promise((r) => setTimeout(r, 5000));

  // Accept cookies
  try {
    const btn = page.locator('button:has-text("Aceptar")');
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch {}

  // Now manually trigger a search by filling location with Google Places
  console.log("\nFilling location...");
  const input = page.locator('input[placeholder*="dónde"]').first();
  await input.click();
  await input.type("Margarita", { delay: 50 });
  await new Promise((r) => setTimeout(r, 3000));

  // Look for pac-container (Google Places autocomplete)
  const pacVisible = await page.evaluate(() => {
    const pac = document.querySelector(".pac-container");
    return pac ? { visible: (pac as HTMLElement).offsetParent !== null, html: pac.innerHTML.slice(0, 500) } : null;
  });
  console.log("PAC container:", pacVisible);

  if (pacVisible) {
    // Click first autocomplete suggestion
    await page.click(".pac-item:first-child");
    await new Promise((r) => setTimeout(r, 2000));
  } else {
    // Try pressing down arrow and enter
    await input.press("ArrowDown");
    await new Promise((r) => setTimeout(r, 500));
    await input.press("Enter");
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Click search button (the round one)
  console.log("\nClicking search...");
  const searchBtn = page.locator("button").filter({ hasText: "Buscar" }).last();
  try {
    await searchBtn.click({ timeout: 5000, force: true });
  } catch {
    // Try the icon button
    const iconBtn = page.locator('button[type="button"]').last();
    await iconBtn.click({ force: true });
  }

  await new Promise((r) => setTimeout(r, 10000));

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
  );
  console.log("\nStay links found:", links.length);
  links.slice(0, 20).forEach((l) => console.log(" ", l));

  await browser.close();
})().catch(console.error);
