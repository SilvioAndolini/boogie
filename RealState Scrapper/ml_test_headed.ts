import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  // Test 1: Search page
  const searchPage = await ctx.newPage();
  await searchPage.goto("https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  console.log(`Search URL: ${searchPage.url()}`);
  const searchTitle = await searchPage.title();
  console.log(`Search title: ${searchTitle}`);

  const urls = await searchPage.evaluate(() =>
    [...new Set(Array.from(document.querySelectorAll("a"))
      .map(a => (a as HTMLAnchorElement).href)
      .filter(h => /MLV-\d+/.test(h))
      .map(h => h.split("#")[0].split("?")[0]))]
  );
  console.log(`Found ${urls.length} listing URLs`);
  for (const u of urls.slice(0, 5)) console.log(`  ${u}`);
  await searchPage.close();

  // Test 2: Direct property page
  if (urls.length > 0) {
    const propPage = await ctx.newPage();
    const testUrl = urls[0];
    await propPage.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    console.log(`\nProp URL: ${propPage.url()}`);
    const h1 = await propPage.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "NO H1");
    console.log(`H1: ${h1}`);
    const bodySnippet = await propPage.evaluate(() => document.body.innerText.slice(0, 800));
    console.log(`Body:\n${bodySnippet}`);
    await propPage.close();
  }

  await browser.close();
})().catch(console.error);
