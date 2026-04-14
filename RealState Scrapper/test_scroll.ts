import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const searchLocation = async (location: string, page: number = 1) => {
    const pg = await ctx.newPage();
    try {
      // For page > 1, add page param
      const url = page === 1
        ? "https://estei.app/search"
        : `https://estei.app/search?page=${page}`;
      await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise(r => setTimeout(r, 3000));

      // Accept cookies
      try {
        const btn = pg.locator('button:has-text("Aceptar")');
        if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); }
      } catch {}

      // Type location
      const input = pg.locator('input[placeholder*="dónde"]').first();
      await input.click();
      await input.type(location, { delay: 30 });
      await new Promise(r => setTimeout(r, 1500));
      await input.press("ArrowDown");
      await new Promise(r => setTimeout(r, 300));
      await input.press("Enter");
      await new Promise(r => setTimeout(r, 1000));

      // Click search
      const btn = pg.locator("button").filter({ hasText: "Buscar" }).last();
      await btn.click({ timeout: 5000, force: true });
      await new Promise(r => setTimeout(r, 8000));

      // Scroll heavily
      for (let i = 0; i < 15; i++) {
        await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1000));
      }
      await new Promise(r => setTimeout(r, 3000));

      // Check for "load more" or "next" buttons
      const nextBtn = pg.locator('button:has-text("Ver más"), button:has-text("Siguiente"), button:has-text("Cargar más"), a:has-text("Siguiente")');
      const hasNext = await nextBtn.count();
      console.log(`  "Load more/Siguiente" buttons: ${hasNext}`);
      if (hasNext > 0) {
        const text = await nextBtn.first().textContent();
        console.log(`  Button text: ${text?.trim()}`);
      }

      const links = await pg.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
      );

      // Also check page info
      const totalText = await pg.evaluate(() => document.body.innerText);
      const totalMatch = totalText.match(/(\d+)\s*(?:resultado|propiedad|alojamiento|listing)/i);
      if (totalMatch) console.log(`  Total in text: ${totalMatch[0]}`);

      console.log(`${location} (p${page}): ${links.length} links`);
      return links;
    } catch (e: any) {
      console.log(`${location}: ERROR ${e.message?.slice(0, 50)}`);
      return [];
    } finally {
      await pg.close();
    }
  };

  // Test with heavy scrolling
  console.log("=== Test with heavy scrolling ===");
  const links1 = await searchLocation("Caracas");
  console.log(`Unique IDs: ${new Set(links1.map(l => l.match(/stay\/(\d+)/)?.[1]).filter(Boolean)).size}`);

  // Test different locations to get different properties
  console.log("\n=== Multiple locations ===");
  const allIds = new Set<string>();
  for (const loc of ["Caracas", "Margarita", "La Guaira", "Falcon", "Merida", "Barquisimeto", "Valencia", "Maracaibo"]) {
    const links = await searchLocation(loc);
    for (const l of links) {
      const m = l.match(/stay\/(\d+)/);
      if (m) allIds.add(m[1]);
    }
    console.log(`  Running total: ${allIds.size} unique IDs`);
  }
  console.log(`\nTotal unique IDs: ${allIds.size}`);

  await browser.close();
})().catch(console.error);
