import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();

  // Search for property listings - try different categories
  const searchUrls = [
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/venta/",
  ];

  for (const url of searchUrls) {
    console.log(`\n=== ${url} ===`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    const listings = await page.evaluate(() => {
      const items = document.querySelectorAll('[class*="poly-card"], .ui-search-result, [class*="listing"]');
      const results: any[] = [];
      for (const item of items) {
        const link = item.querySelector('a[href*="mercadolibre"]');
        const title = item.querySelector('h2, [class*="title"]');
        const price = item.querySelector('[class*="price"]');
        const seller = item.querySelector('[class*="seller"], [class*="brand"], [class*="official"]');

        results.push({
          href: (link as HTMLAnchorElement)?.href || "",
          title: title?.textContent?.trim() || "",
          price: price?.textContent?.trim() || "",
          hasSellerBadge: !!seller,
          sellerText: seller?.textContent?.trim()?.slice(0, 80) || "",
        });
      }
      return results;
    });

    console.log(`Found ${listings.length} listings`);
    listings.slice(0, 5).forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.title?.slice(0, 60)}`);
      console.log(`     Price: ${l.price?.slice(0, 30)}`);
      console.log(`     Agency badge: ${l.hasSellerBadge} ${l.sellerText}`);
      console.log(`     URL: ${l.href?.slice(0, 100)}`);
    });
  }

  await browser.close();
})().catch(console.error);
