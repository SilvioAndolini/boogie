import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  // Test direct property page (known from ml_index.json)
  const testUrl = "https://apartamento.mercadolibre.com.ve/MLV-960005004-alquiler-de-apartamento-de-80mt2-en-macaracuay-av-_JM";
  const page = await ctx.newPage();
  await page.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 5000));

  const title = await page.title();
  console.log(`Title: ${title}`);
  console.log(`URL: ${page.url()}`);

  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "NO H1");
  console.log(`H1: ${h1}`);

  const bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log(`\nBody:\n${bodySnippet}`);

  await page.close();
  await browser.close();
})().catch(console.error);
