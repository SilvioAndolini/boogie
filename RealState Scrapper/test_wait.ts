import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const testProperty = async (slug: string) => {
    const page = await ctx.newPage();
    const url = `https://estei.app/stay/${slug}/profile`;
    console.log(`\n--- ${slug} ---`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

      // Accept cookies ASAP
      try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await new Promise(r => setTimeout(r, 200)); } } catch {}

      // Wait for the loading spinner to disappear
      await page.waitForFunction(() => {
        const spinner = document.querySelector('[data-testid="three-dots-loading"]');
        return !spinner?.isConnected;
      }, { timeout: 20000 }).catch(() => {});

      // Wait for property content to appear (at least 3 non-empty lines after "Registrarse")
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        const lines = text.split("\n").filter(l => l.trim());
        const regIdx = lines.findIndex(l => l.includes("Registrarse"));
        if (regIdx < 0) return false;
        // Check if there's meaningful content after Registrarse
        return lines.slice(regIdx + 1, regIdx + 10).some(l => l.length > 10 && !l.includes("No se encontró"));
      }, { timeout: 15000 }).catch(() => {});

      await new Promise(r => setTimeout(r, 2000));

      const text = await page.evaluate(() => document.body.innerText);
      const lines = text.split("\n").filter(l => l.trim());

      // Find title (first non-header line after "Registrarse")
      const regIdx = lines.findIndex(l => l.includes("Registrarse"));
      const title = regIdx >= 0 ? lines[regIdx + 1]?.trim() : "";

      console.log(`  Title: "${title}"`);
      console.log(`  Has data: ${!text.includes("No se encontró")}`);
      console.log(`  Lines: ${lines.length}`);

      const hasData = !text.includes("No se encontró") && title.length > 2;
      return hasData;
    } catch (e: any) {
      console.log(`  Error: ${e.message?.slice(0, 80)}`);
      return false;
    } finally {
      await page.close();
    }
  };

  // Test 5 properties with the fixed wait
  const slugs = [
    "17281517903060393862", // Known working
    "17273652068679158460", // From infoScrapeada
    "17664338998486412566", // From search results
    "17721693857311894135", // From search results
    "17294015304206404668", // From search results
  ];

  let success = 0;
  for (const slug of slugs) {
    const ok = await testProperty(slug);
    if (ok) success++;
  }

  console.log(`\nResult: ${success}/${slugs.length} succeeded`);

  await browser.close();
})().catch(console.error);
