import { chromium, type BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  outputDir: path.join(__dirname, "ml_properties"),
  indexFile: path.join(__dirname, "ml_index.json"),
  delayBetweenProperties: 8000,   // 8s entre propiedades
  delayBetweenSearchPages: 5000,  // 5s entre páginas de búsqueda
  searchUrls: [
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/terrenos/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/locales/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/oficinas/alquiler/",
  ],
  maxSearchPages: 5,
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function saveJSON(fp: string, data: unknown) { ensureDir(path.dirname(fp)); fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8"); }
function loadJSON<T>(fp: string, fb: T): T { try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch {} return fb; }

// ─── Fase 1: Descubrir URLs de listings ───
async function discoverUrls(ctx: BrowserContext): Promise<string[]> {
  const urls = new Set<string>();
  for (const searchUrl of CONFIG.searchUrls) {
    for (let pg = 0; pg < CONFIG.maxSearchPages; pg++) {
      const page = await ctx.newPage();
      try {
        const pageUrl = pg === 0 ? searchUrl : searchUrl + `_Desde_${pg * 48 + 1}`;
        await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
        await sleep(3000);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
            .map((a: any) => a.href.split("#")[0].split("?")[0])
            .filter((h: string) => h.match(/MLV-\d+/))
        );
        const cat = searchUrl.split("/").slice(-3, -1).join("/");
        console.log(`  ${cat} p${pg + 1}: +${links.length} (total: ${urls.size})`);
        for (const l of links) urls.add(l);
      } catch { console.log(`  ERROR p${pg + 1}`); }
      finally { await page.close(); }
      await sleep(CONFIG.delayBetweenSearchPages);
    }
  }
  return Array.from(urls);
}

// ─── Fase 2: Scrape individual ───
async function scrapeProperty(ctx: BrowserContext, url: string): Promise<any> {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(5000);

    // Accept cookies
    try { const btn = page.locator('button:has-text("Aceptar cookies")'); if (await btn.isVisible({ timeout: 2000 })) await btn.click(); } catch {}
    await sleep(500);

    const text = await page.evaluate(() => document.body.innerText);

    // ── Detección de agencia ──
    const agencyKeywords = [
      "Información de la corredora", "Información de la inmobiliaria",
      "Información de la tienda", "Ir a la tienda oficial",
      "tienda oficial", "Corredora con", "Corredor con",
      "Inmobiliaria con", "Agencia inmobiliaria",
    ];
    const isAgency = agencyKeywords.some(k => text.includes(k));
    if (isAgency) return { _skip: true, reason: "agency" };

    // ── Esperar que cargue el contenido ──
    const loaded = await page.waitForFunction(() => {
      const h1 = document.querySelector("h1");
      return h1 && h1.textContent && h1.textContent.length > 10;
    }, { timeout: 15000 }).then(() => true).catch(() => false);

    if (!loaded) return null;

    // ── Obtener teléfono desde WhatsApp popup ──
    let phone: string | null = null;
    const waBtn = page.locator('button').filter({ hasText: /WhatsApp/i }).first();
    if (await waBtn.isVisible({ timeout: 3000 })) {
      const popupPromise = ctx.waitForEvent("page", { timeout: 10000 }).catch(() => null);
      await waBtn.click();
      await sleep(2000);
      const popup = await popupPromise;
      if (popup) {
        const m = popup.url().match(/phone=(\d+)/);
        if (m) phone = m[1];
        await popup.close();
      }
    }

    // ── Extraer datos ──
    const data = await page.evaluate(() => {
      const text = document.body.innerText;

      const h1 = document.querySelector("h1");
      const titulo = h1?.textContent?.trim() || "";

      const priceMatch = text.match(/US\$\s*([\d.,]+)/);
      const precio = priceMatch ? priceMatch[1].replace(/\./g, "").replace(",", ".") : null;

      const locMatch = text.match(/Ubicación\s*\n([^\n]+)/);
      const ubicacion = locMatch ? locMatch[1].trim() : "";

      // Descripción limpia
      const descMatch = text.match(/Descripción\s*\n([\s\S]*?)(?:\nInformación de la zona|\nPublicación #)/);
      const descripcion = descMatch ? descMatch[1].trim() : "";

      // Specs
      const superficie = text.match(/Superficie total\s*\n(\d+)/)?.[1] || null;
      const hab = text.match(/Habitaciones\s*\n(\d+)/)?.[1] || null;
      const banos = text.match(/Baños\s*\n(\d+)/)?.[1] || null;
      const estacionamientos = text.match(/Estacionamientos\s*\n(\d+)/)?.[1] || null;
      const antiguedad = text.match(/Antigüedad\s*\n([^\n]+)/)?.[1]?.trim() || null;
      const piso = text.match(/Número de piso de la unidad\s*\n([^\n]+)/)?.[1]?.trim() || null;
      const amoblado = text.includes("Amoblado: Sí") ? true : text.includes("Amoblado: No") ? false : null;
      const admiteMascotas = text.includes("Admite mascotas: Sí") ? true : text.includes("Admite mascotas: No") ? false : null;

      // MLV ID
      const mlvMatch = window.location.href.match(/MLV-(\d+)/);
      const mlvId = mlvMatch ? mlvMatch[1] : "";

      return {
        titulo, precio, ubicacion, descripcion,
        superficie: superficie ? parseInt(superficie) : null,
        habitaciones: hab ? parseInt(hab) : null,
        banos: banos ? parseInt(banos) : null,
        estacionamientos: estacionamientos ? parseInt(estacionamientos) : null,
        antiguedad, piso, amoblado, admiteMascotas, mlvId,
      };
    });

    if (!data.titulo || data.titulo.length < 5) return null;

    return {
      id: data.mlvId, url, titulo: data.titulo,
      precio: data.precio ? `$${data.precio} USD` : null,
      precioNumerico: data.precio ? parseFloat(data.precio) : null,
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
      superficie: data.superficie,
      superficieTexto: data.superficie ? `${data.superficie} m²` : null,
      habitaciones: data.habitaciones,
      banos: data.banos,
      estacionamientos: data.estacionamientos,
      antiguedad: data.antiguedad,
      piso: data.piso,
      amoblado: data.amoblado,
      admiteMascotas: data.admiteMascotas,
      telefono: phone,
      whatsapp: phone ? `https://wa.me/${phone}` : null,
      telefonoFormateado: phone ? `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}` : null,
      publicadoPor: "particular",
      scrapedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

// ─── Main ───
async function main() {
  console.log("MercadoLibre VE Property Scraper");
  console.log("=".repeat(50));
  ensureDir(CONFIG.outputDir);
  const index: any[] = loadJSON(CONFIG.indexFile, []);
  const known = new Set(index.map((p: any) => p.id));
  console.log(`En indice: ${known.size}`);

  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const authState = path.join(__dirname, "ml_auth.json");
  const contextOpts: any = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  };
  if (fs.existsSync(authState)) contextOpts.storageState = authState;

  try {
    // ── Descubrir URLs ──
    console.log("\n--- Descubriendo URLs ---");
    const ctx1 = await browser.newContext(contextOpts);
    const allUrls = await discoverUrls(ctx1);
    await ctx1.close();

    const newUrls = allUrls.filter(u => { const m = u.match(/MLV-(\d+)/); return m && !known.has(m[1]); });
    console.log(`Total URLs: ${allUrls.length} | Nuevas: ${newUrls.length}`);

    // ── Scrape ──
    console.log("\n--- Scrapeando (8s entre cada una) ---");
    let scraped = 0, skipped = 0, failed = 0;
    const ctx2 = await browser.newContext(contextOpts);

    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      const data = await scrapeProperty(ctx2, url);

      if (data?._skip) { skipped++; }
      else if (data?.id) {
        index.push(data);
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}] ${data.titulo.slice(0, 50)} | ${data.precio || "?"} | ${data.telefonoFormateado || "sin tel"} | ${data.ubicacion.slice(0, 40)}`);
      } else { failed++; }

      // Progreso cada 10
      if ((i + 1) % 10 === 0) {
        console.log(`  ... ${i + 1}/${newUrls.length} procesadas (${scraped} ok | ${skipped} agencias | ${failed} fallos)`);
      }

      await sleep(CONFIG.delayBetweenProperties);
    }

    await ctx2.close();
    console.log(`\n${"=".repeat(50)}\nRESUMEN FINAL`);
    console.log(`  Propiedades scrapeadas: ${scraped}`);
    console.log(`  Agencias ignoradas: ${skipped}`);
    console.log(`  Fallos: ${failed}`);
    console.log(`  Total en indice: ${index.length}`);
  } finally { await browser.close(); }
}

main().catch(console.error);
