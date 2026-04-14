import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const testSearch = async (location: string) => {
    const page = await ctx.newPage();
    const url = `https://estei.app/search?location=${location}&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;
    
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise(r => setTimeout(r, 1000));
      
      // Accept cookies
      try {
        const btn = page.locator('button:has-text("Aceptar")');
        if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); }
      } catch {}

      // Click search
      try {
        const btn = page.locator("button").filter({ hasText: "Buscar" }).last();
        await btn.click({ timeout: 3000, force: true });
      } catch {}

      // Wait for results
      await new Promise(r => setTimeout(r, 8000));

      // Scroll
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1000));
      }
      await new Promise(r => setTimeout(r, 2000));

      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
      );
      
      console.log(`${location}: ${links.length} links`);
      return links;
    } catch (e: any) {
      console.log(`${location}: ERROR ${e.message?.slice(0, 50)}`);
      return [];
    } finally {
      await page.close();
    }
  };

  // Test multiple locations
  for (const loc of ["Caracas", "Margarita", "La+Guaira", "Venezuela"]) {
    await testSearch(loc);
  }

  await browser.close();
})().catch(console.error);
