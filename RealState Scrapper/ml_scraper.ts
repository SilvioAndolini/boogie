import { chromium, type BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  outputDir: path.join(__dirname, "ml_properties"),
  indexFile: path.join(__dirname, "ml_index.json"),
  maxPages: 5,
  searchUrls: [
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/venta/",
  ],
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function saveJSON(fp: string, data: unknown) { ensureDir(path.dirname(fp)); fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8"); }
function loadJSON<T>(fp: string, fb: T): T { try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch {} return fb; }

async function getListingUrls(ctx: BrowserContext): Promise<string[]> {
  const urls = new Set<string>();
  for (const searchUrl of CONFIG.searchUrls) {
    for (let pg = 0; pg < CONFIG.maxPages; pg++) {
      const page = await ctx.newPage();
      try {
        const pageUrl = pg === 0 ? searchUrl : searchUrl + `_Desde_${pg * 48 + 1}`;
        await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
        await sleep(2000);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
            .map((a: any) => a.href.split("#")[0].split("?")[0])
            .filter((h: string) => h.match(/MLV-\d+/))
        );
        for (const l of links) urls.add(l);
        console.log(`  ${searchUrl.split("/").slice(-2).join("/")} p${pg + 1}: +${links.length} (total: ${urls.size})`);
      } catch { console.log(`  ERROR page ${pg + 1}`); }
      finally { await page.close(); }
      if (urls.size > 500) break;
    }
  }
  return Array.from(urls);
}

async function scrapeProperty(ctx: BrowserContext, url: string): Promise<any | null> {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(3000);

    // Accept cookies
    try { const btn = page.locator('button:has-text("Aceptar cookies")'); if (await btn.isVisible({ timeout: 1000 })) await btn.click(); } catch {}
    await sleep(500);

    const text = await page.evaluate(() => document.body.innerText);

    // Skip agencies
    const isAgency = text.includes("Información de la corredora") || text.includes("Información de la inmobiliaria");
    if (isAgency) {
      const sellerName = text.match(/Informaci[oó]n de la?\s*(?:corredora|inmobiliaria)\s*\n([^\n]+)/)?.[1]?.trim() || "unknown";
      await page.close();
      return { _skip: true, reason: `agency: ${sellerName}` };
    }

    // Extract phone from WhatsApp button
    let phone: string | null = null;
    const waBtn = page.locator('button').filter({ hasText: /WhatsApp/i }).first();
    if (await waBtn.isVisible({ timeout: 2000 })) {
      const popupPromise = ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null);
      await waBtn.click();
      await sleep(2000);
      const popup = await popupPromise;
      if (popup) {
        const popupUrl = popup.url();
        const phoneMatch = popupUrl.match(/phone=(\d+)/);
        if (phoneMatch) phone = phoneMatch[1];
        await popup.close();
      }
    }

    // If no WhatsApp, try "Ver teléfono"
    if (!phone) {
      const phoneBtn = page.locator('text=Ver teléfono').first();
      if (await phoneBtn.isVisible({ timeout: 1000 })) {
        await phoneBtn.click();
        await sleep(2000);
        const phones = await page.evaluate(() => {
          const t = document.body.innerText;
          return t.match(/\b0\d{3}[-\s]?\d{7}\b/g) || t.match(/\b\d{4}[-\s]?\d{3}[-\s]?\d{4}\b/g) || [];
        });
        if (phones.length > 0) phone = phones[0];
      }
    }

    // Extract data
    const data = await page.evaluate(() => {
      const text = document.body.innerText;

      // Title
      const h1 = document.querySelector("h1");
      const titulo = h1?.textContent?.trim() || "";

      // Price
      const priceMatch = text.match(/US\$\s*([\d.,]+)/);
      const precio = priceMatch ? priceMatch[1] : null;

      // Location
      const locMatch = text.match(/Ubicación\s*\n([\s\S]{0,300})/);
      const ubicacion = locMatch ? locMatch[1].trim().split("\n")[0] : "";

      // Description
      const descStart = text.indexOf("Descripción");
      let descripcion = "";
      if (descStart >= 0) {
        const afterDesc = text.slice(descStart + 12);
        const endMarkers = ["\nInformación de la zona", "\nPublicación #", "\nMás información"];
        let end = afterDesc.length;
        for (const m of endMarkers) { const idx = afterDesc.indexOf(m); if (idx >= 0 && idx < end) end = idx; }
        descripcion = afterDesc.slice(0, end).trim();
      }

      // Specs
      const superficie = text.match(/Superficie total\s*\n(\d+ m²)/)?.[1] || "";
      const habitaciones = text.match(/Habitaciones\s*\n(\d+)/)?.[1] || "";
      const banos = text.match(/Baños\s*\n(\d+)/)?.[1] || "";
      const antiguedad = text.match(/Antigüedad\s*\n([\w\s]+)/)?.[1] || "";

      // Features from JSON-LD
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      const ldData = jsonLd ? JSON.parse(jsonLd.textContent || "{}") : {};

      // MLV ID
      const mlvMatch = window.location.href.match(/MLV-(\d+)/);
      const mlvId = mlvMatch ? mlvMatch[1] : "";

      return {
        titulo, precio, ubicacion, descripcion, superficie,
        habitaciones, banos, antiguedad, mlvId, ldData,
      };
    });

    return {
      id: data.mlvId, url, titulo: data.titulo,
      precio: data.precio ? `$${data.precio} USD` : null,
      precioNumerico: data.precio ? parseFloat(data.precio.replace(/\./g, "").replace(",", ".")) : null,
      ubicacion: data.ubicacion,
      superficie: data.superficie,
      habitaciones: data.habitaciones ? parseInt(data.habitaciones) : null,
      banos: data.banos ? parseInt(data.banos) : null,
      antiguedad: data.antiguedad,
      descripcion: data.descripcion,
      telefono: phone,
      whatsapp: phone ? `https://wa.me/${phone}` : null,
      publicadoPor: "particular",
      scrapedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("MercadoLibre VE Scraper\n" + "=".repeat(50));
  ensureDir(CONFIG.outputDir);
  const index: any[] = loadJSON(CONFIG.indexFile, []);
  const known = new Set(index.map((p: any) => p.id));
  console.log(`En indice: ${known.size}`);

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  try {
    console.log("\n--- Descubriendo URLs ---");
    const allUrls = await getListingUrls(ctx);
    const newUrls = allUrls.filter(u => { const m = u.match(/MLV-(\d+)/); return m && !known.has(m[1]); });
    console.log(`Total: ${allUrls.length} | Nuevas: ${newUrls.length}`);

    await ctx.close();
    const scrapeCtx = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    console.log("\n--- Scrapeando ---");
    let scraped = 0, skipped = 0, failed = 0;
    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      const data = await scrapeProperty(scrapeCtx, url);

      if (data?._skip) {
        skipped++;
        if (i % 10 === 0) process.stdout.write(`\r  [${i}/${newUrls.length}] scrapeados: ${scraped} | agencias: ${skipped}`);
        continue;
      }

      if (data && data.id) {
        index.push(data);
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}] ${data.titulo?.slice(0, 50)} | ${data.precio || "?"} | ${data.telefono || "sin tel"} | ${data.ubicacion?.slice(0, 30)}`);
      } else {
        failed++;
      }

      await sleep(500);
    }

    console.log(`\n${"=".repeat(50)}\nRESUMEN: ${scraped} scrapeados | ${skipped} agencias ignoradas | ${failed} fallos | ${index.length} total`);
  } finally { await browser.close(); }
}

main().catch(console.error);
