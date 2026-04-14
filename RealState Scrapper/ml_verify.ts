import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const authState = path.join(__dirname, "ml_auth.json");
  const contextOpts: any = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    storageState: authState,
  };

  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const ctx = await browser.newContext(contextOpts);

  const searchPage = await ctx.newPage();
  await searchPage.goto("https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 3000));
  const urls: string[] = await searchPage.evaluate(() =>
    [...new Set(Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
      .map((a: any) => a.href.split("#")[0].split("?")[0])
      .filter((h: string) => h.match(/MLV-\d+/)))]
  );
  await searchPage.close();
  console.log(`Found ${urls.length} URLs. Scanning for particulares...\n`);

  const agencyKw = ["Información de la corredora", "Información de la inmobiliaria", "Información de la tienda", "Ir a la tienda oficial", "Corredora con", "Corredor con", "tienda oficial", "Inmobiliaria con"];
  let particulares = 0;
  let agencias = 0;
  let tested = 0;
  const maxParticulares = 3;

  for (const url of urls) {
    if (particulares >= maxParticulares) break;
    tested++;
    const pg = await ctx.newPage();
    try {
      await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise(r => setTimeout(r, 4000));

      const text = await pg.evaluate(() => document.body.innerText);
      const isAgency = agencyKw.some(k => text.includes(k));

      if (isAgency) {
        agencias++;
        process.stdout.write(".");
        await pg.close();
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      particulares++;
      const h1 = await pg.evaluate(() => document.querySelector("h1")?.textContent?.trim() || "");
      console.log(`\n--- PARTICULAR #${particulares}: ${url.match(/MLV-\d+/)?.[0]} ---`);
      console.log(`  Title: ${h1.slice(0, 80)}`);

      let phone: string | null = null;
      try {
        const waBtn = pg.locator('button').filter({ hasText: /WhatsApp/i }).first();
        if (await waBtn.isVisible({ timeout: 3000 })) {
          const popupPromise = ctx.waitForEvent("page", { timeout: 10000 }).catch(() => null);
          await waBtn.click();
          await new Promise(r => setTimeout(r, 3000));
          const popup = await popupPromise;
          if (popup) {
            const m = popup.url().match(/phone=(\d+)/);
            if (m) phone = m[1];
            try { await popup.close(); } catch {}
          }
        }
      } catch {}

      const data = await pg.evaluate(() => {
        const t = document.body.innerText;
        return {
          price: t.match(/US\$\s*([\d.,]+)/)?.[1] || t.match(/Bs\.\s*([\d.,]+)/)?.[1] || null,
          loc: t.match(/Ubicación\s*\n([^\n]+)/)?.[1]?.trim() || "",
          sup: t.match(/Superficie total\s*\n(\d+)/)?.[1] || null,
          hab: t.match(/Habitaciones\s*\n(\d+)/)?.[1] || null,
          banos: t.match(/Baños\s*\n(\d+)/)?.[1] || null,
          desc: t.match(/Descripción\s*\n([\s\S]*?)(?:\nInformación de la zona|\nPublicación #)/)?.[1]?.trim().slice(0, 150) || "",
        };
      });

      console.log(`  Price: ${data.price || "?"}`);
      console.log(`  Phone: ${phone || "NONE"}`);
      console.log(`  Location: ${data.loc}`);
      console.log(`  ${data.sup}m² | ${data.hab}h | ${data.banos}b`);
      console.log(`  Desc: ${data.desc.slice(0, 100)}`);
    } catch (e: any) {
      console.log(`\n  ERROR: ${e.message?.slice(0, 60)}`);
    } finally {
      await pg.close();
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n\nResumen: ${tested} tested | ${agencias} agencias | ${particulares} particulares`);
  await browser.close();
})().catch(console.error);
