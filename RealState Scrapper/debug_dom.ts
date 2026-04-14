import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  // Load discovered IDs
  const discovered = JSON.parse(fs.readFileSync(path.join(__dirname, "discovered_ids.json"), "utf-8"));
  console.log(`Testing first 5 IDs from ${discovered.length} discovered...\n`);

  const testSlugs = discovered.slice(0, 5);

  for (const slug of testSlugs) {
    const page = await ctx.newPage();
    const url = `https://estei.app/stay/${slug}/profile`;
    console.log(`--- ${slug} ---`);
    console.log(`  URL: ${url}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise(r => setTimeout(r, 5000));

      // Accept cookies
      try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); } } catch {}

      await new Promise(r => setTimeout(r, 3000));

      const text = await page.evaluate(() => document.body.innerText);
      const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");
      const title = await page.evaluate(() => document.title);

      console.log(`  Title: ${title}`);
      console.log(`  H1: ${h1}`);
      console.log(`  Has "No se encontró": ${text.includes("No se encontró")}`);
      console.log(`  Has "Iniciar sesión": ${text.includes("Iniciar sesión")}`);
      console.log(`  Text (300): ${text.slice(0, 300)}`);
      console.log(`  URL after load: ${page.url()}`);
    } catch (e: any) {
      console.log(`  Error: ${e.message?.slice(0, 100)}`);
    } finally {
      await page.close();
    }
    console.log("");
  }

  await browser.close();
})().catch(console.error);
