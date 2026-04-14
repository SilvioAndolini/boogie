import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();
  const url = "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/";
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 5000));

  const title = await page.title();
  console.log(`Title: ${title}`);
  console.log(`URL: ${page.url()}`);

  const allLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map(a => ({
      href: (a as HTMLAnchorElement).href,
      text: a.textContent?.trim().slice(0, 60) || "",
    })).filter(a => a.href.includes("MLV") || a.href.includes("mercadolibre"))
  );
  console.log(`\nLinks with MLV or mercadolibre: ${allLinks.length}`);
  for (const l of allLinks.slice(0, 20)) {
    console.log(`  ${l.href.slice(0, 120)} | "${l.text.slice(0, 40)}"`);
  }

  const allHrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map(a => (a as HTMLAnchorElement).href)
  );
  const unique = [...new Set(allHrefs.map(h => {
    const m = h.match(/MLV-\d+/);
    return m ? m[0] : null;
  }).filter(Boolean))];
  console.log(`\nUnique MLV IDs in any link: ${unique.length}`);
  console.log(unique.slice(0, 10));

  const bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  console.log(`\nBody snippet:\n${bodySnippet}`);

  await page.close();
  await browser.close();
})().catch(console.error);
