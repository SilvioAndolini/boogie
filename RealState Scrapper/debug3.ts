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
  const allResponses: { url: string; status: number; body: any }[] = [];

  page.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if (
      ct.includes("json") ||
      url.includes("/api/") ||
      url.includes("supabase") ||
      url.includes("rest/") ||
      url.includes("graphql") ||
      url.includes("rpc") ||
      url.includes("gql")
    ) {
      try {
        const body = await resp.json();
        allResponses.push({ url, status: resp.status(), body });
      } catch {}
    }
  });

  await page.goto("https://estei.app/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Accept cookies
  try {
    const acceptBtn = page.locator('button:has-text("Aceptar")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {}

  // Click on "Caracas" popular destination
  console.log("Clicking Caracas destination...");
  const caracasLink = page.locator('text=Caracas').first();
  await caracasLink.click();
  await page.waitForTimeout(3000);

  // Now click search button
  console.log("Clicking search button...");
  const searchBtn = page.locator('button[type="button"]:has-text("Buscar"):visible').last();
  if (await searchBtn.isVisible({ timeout: 3000 })) {
    await searchBtn.click();
    await page.waitForTimeout(8000);
  } else {
    console.log("Search button not visible, trying submit...");
  }

  // Check for stay links on current page
  const stayLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => ({
      href: (a as HTMLAnchorElement).href,
      text: a.textContent?.trim().slice(0, 50),
    }))
  );
  console.log("Stay links found:", stayLinks.length);
  stayLinks.slice(0, 20).forEach((l) => console.log("  ", l.href, "-", l.text));

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\nPage text (first 1000):", bodyText.slice(0, 1000));

  // Dump ALL JSON responses
  console.log("\n=== ALL JSON API RESPONSES ===");
  for (const r of allResponses) {
    if (r.url.includes("google") || r.url.includes("fonts") || r.url.includes("zoho") || r.url.includes("doubleclick") || r.url.includes("clarity") || r.url.includes("googleads") || r.url.includes("pagead")) continue;
    const str = r.body ? JSON.stringify(r.body) : "";
    console.log(`\n${r.status} ${r.url}`);
    if (str.length > 5) console.log(`  Body (${str.length} chars): ${str.slice(0, 500)}`);
  }

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
