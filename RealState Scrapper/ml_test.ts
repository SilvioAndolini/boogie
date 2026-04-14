import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  // Get first 3 URLs from search
  const page = await ctx.newPage();
  await page.goto("https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 3000));
  const urls: string[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
      .map((a: any) => a.href.split("#")[0].split("?")[0])
      .filter((h: string) => h.match(/MLV-\d+/))
  );
  const unique = [...new Set(urls)].slice(0, 3);
  console.log("URLs to test:", unique);
  await page.close();

  for (const url of unique) {
    const page = await ctx.newPage();
    console.log(`\n=== ${url.match(/MLV-\d+/)?.[0]} ===`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise(r => setTimeout(r, 4000));

      // Accept cookies
      try { const btn = page.locator('button:has-text("Aceptar cookies")'); if (await btn.isVisible({ timeout: 1000 })) await btn.click(); } catch {}
      await new Promise(r => setTimeout(r, 500));

      const text = await page.evaluate(() => document.body.innerText);
      const isAgency = text.includes("Información de la corredora") || text.includes("Información de la inmobiliaria");

      if (isAgency) {
        console.log("  SKIP: Agency");
        await page.close();
        continue;
      }

      // Get phone from WhatsApp
      let phone: string | null = null;
      const waBtn = page.locator('button').filter({ hasText: /WhatsApp/i }).first();
      if (await waBtn.isVisible({ timeout: 2000 })) {
        const popupPromise = ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null);
        await waBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        const popup = await popupPromise;
        if (popup) {
          const m = popup.url().match(/phone=(\d+)/);
          if (m) phone = m[1];
          await popup.close();
        }
      }

      // Extract basic info
      const title = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");
      const price = text.match(/US\$\s*([\d.,]+)/)?.[1] || "";
      const loc = text.match(/Ubicación\s*\n([\s\S]{0,200})/)?.[1]?.trim()?.split("\n")[0] || "";

      console.log(`  Title: ${title.slice(0, 60)}`);
      console.log(`  Price: $${price}`);
      console.log(`  Phone: ${phone || "none"}`);
      console.log(`  Location: ${loc.slice(0, 60)}`);
    } catch (e: any) {
      console.log(`  ERROR: ${e.message?.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})().catch(console.error);
