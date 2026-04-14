import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const slugs = JSON.parse(fs.readFileSync(path.join(__dirname, "discovered_ids.json"), "utf-8")).slice(0, 5);
  console.log(`Testing ${slugs.length} properties...\n`);

  let success = 0, fail = 0;
  for (const slug of slugs) {
    const page = await ctx.newPage();
    console.log(`--- ${slug} ---`);
    try {
      await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });

      try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await new Promise(r => setTimeout(r, 200)); } } catch {}

      // Wait for spinner
      const spinnerGone = await page.waitForFunction(() => {
        const sp = document.querySelector('[data-testid="three-dots-loading"]');
        return !sp?.isConnected;
      }, { timeout: 15000 }).then(() => true).catch(() => false);
      console.log(`  Spinner gone: ${spinnerGone}`);

      // Wait for content
      const contentLoaded = await page.waitForFunction(() => {
        const text = document.body.innerText;
        const lines = text.split("\n").filter((l: string) => l.trim());
        const regIdx = lines.findIndex((l: string) => l.includes("Registrarse"));
        if (regIdx < 0) return false;
        return lines.slice(regIdx + 1, regIdx + 10).some((l: string) => l.length > 10 && !l.includes("No se encontró"));
      }, { timeout: 10000 }).then(() => true).catch(() => false);
      console.log(`  Content loaded: ${contentLoaded}`);

      await new Promise(r => setTimeout(r, 1000));

      const text = await page.evaluate(() => document.body.innerText);
      const lines = text.split("\n").filter((l: string) => l.trim());
      const regIdx = lines.findIndex((l: string) => l.includes("Registrarse"));
      const titulo = regIdx >= 0 ? lines[regIdx + 1]?.trim() : "";
      const hasNoFound = text.includes("No se encontró");

      console.log(`  Title: "${titulo}"`);
      console.log(`  No found: ${hasNoFound}`);
      console.log(`  Lines: ${lines.length}`);
      console.log(`  First 5: ${lines.slice(0, 5).join(" | ")}`);

      if (titulo && titulo.length > 2 && !hasNoFound) {
        success++;
        console.log(`  SUCCESS`);
      } else {
        fail++;
        console.log(`  FAIL`);
      }
    } catch (e: any) {
      fail++;
      console.log(`  ERROR: ${e.message?.slice(0, 100)}`);
    } finally {
      await page.close();
    }
    console.log("");
  }

  console.log(`Result: ${success} success, ${fail} fail`);
  await browser.close();
})().catch(console.error);
