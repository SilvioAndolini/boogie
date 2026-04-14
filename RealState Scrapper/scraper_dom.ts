import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  targetCount: 200,
  outputDir: path.join(__dirname, "properties"),
  indexFile: path.join(__dirname, "index.json"),
  errorFile: path.join(__dirname, "errors.json"),
  maxPagesPerLocation: 5,
  locations: [
    "Caracas", "Margarita", "La Guaira", "Falcon", "Merida",
    "Barquisimeto", "Valencia", "Maracaibo", "Puerto La Cruz",
    "Maracay", "Porlamar", "Cumana", "San Cristobal",
    "Puerto Ayacucho", "Pampatar", "Choroni", "Morrocoy",
    "Los Roques", "Ciudad Bolivar", "Coro", "Puerto Cabello",
    "Barcelona", "Maturin", "San Fernando",
  ],
};

interface IndexEntry {
  id: string; slug: string; titulo: string; url: string; carpeta: string; scrapedAt: string;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function saveJSON(fp: string, data: unknown) { ensureDir(path.dirname(fp)); fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8"); }
function loadJSON<T>(fp: string, fb: T): T { try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch {} return fb; }
function slugify(t: string): string { return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        file.close(); fs.unlink(dest, () => {});
        downloadFile(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); reject(); return; }
      res.pipe(file); file.on("finish", () => { file.close(); resolve(); });
    }).on("error", () => { file.close(); fs.unlink(dest, () => {}); reject(); });
  });
}

async function discoverUrls(ctx: BrowserContext, knownIds: Set<string>): Promise<string[]> {
  const allIds = new Set<string>(knownIds);

  for (const loc of CONFIG.locations) {
    const page = await ctx.newPage();
    try {
      await page.goto("https://estei.app/search", { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(3000);
      try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await sleep(300); } } catch {}

      const input = page.locator('input[placeholder*="dónde"]').first();
      await input.click();
      await input.type(loc, { delay: 30 });
      await sleep(1500);
      await input.press("ArrowDown");
      await sleep(300);
      await input.press("Enter");
      await sleep(1000);

      const btn = page.locator("button").filter({ hasText: "Buscar" }).last();
      await btn.click({ timeout: 5000, force: true });
      await sleep(8000);

      for (let pg = 0; pg < CONFIG.maxPagesPerLocation; pg++) {
        for (let i = 0; i < 5; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(800); }
        await sleep(1500);

        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
        );
        let newCount = 0;
        for (const l of links) { const m = l.match(/stay\/(\d+)/); if (m && !allIds.has(m[1])) { allIds.add(m[1]); newCount++; } }

        const nextBtn = page.locator("button").filter({ hasText: "Siguiente" });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click({ force: true });
          await sleep(5000);
        } else break;
      }

      console.log(`  ${loc}: total unicos ${allIds.size}`);
    } catch (e: any) {
      console.log(`  ${loc}: ERROR`);
    } finally {
      await page.close();
    }
    if (allIds.size >= CONFIG.targetCount + knownIds.size) break;
  }

  return Array.from(allIds);
}

async function scrapePropertyFromDOM(ctx: BrowserContext, slug: string): Promise<any | null> {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(5000);

    // Check if property exists
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes("No se encontró el alojamiento")) return null;

    // Extract data from DOM
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      const h1 = document.querySelector("h1");
      const titulo = h1?.textContent?.trim() || "";

      // Get all text for parsing
      const priceMatch = text.match(/\$?\s*(\d+(?:[.,]\d+)?)\s*(?:USD|noche|\/\s*noche)/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

      // Extract location info
      const locationMatch = text.match(/([\w\s,]+Venezuela[\w\s,]*)/i);
      const location = locationMatch ? locationMatch[1].trim() : "";

      // Get images
      const images = Array.from(document.querySelectorAll("img"))
        .filter((img) => {
          const src = (img as HTMLImageElement).src;
          return src.includes("imagekit") || src.includes("digitaloceanspaces");
        })
        .map((img) => ({ src: (img as HTMLImageElement).src, alt: (img as HTMLImageElement).alt || "" }));

      return {
        titulo,
        location,
        price,
        images,
        pageText: text.slice(0, 5000),
      };
    });

    if (!data.titulo) return null;

    // Parse more fields from pageText
    const text = data.pageText;
    const priceMatch = text.match(/\$?\s*(\d+(?:[.,]\d+)?)\s*(?:USD|noche)/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

    const descMatch = text.match(/Descripción\s*\n([\s\S]*?)(?:\n(?:Capacidad|Comodidades|Anfitrión|Disponibilidad))/);
    const desc = descMatch ? descMatch[1].trim() : "";

    const capMatch = text.match(/(\d+)\s*viajero/i);
    const capacity = capMatch ? parseInt(capMatch[1]) : null;

    const habMatch = text.match(/(\d+)\s*(?:habitaci[oó]n|recámara)/i);
    const bedrooms = habMatch ? parseInt(habMatch[1]) : null;

    const banoMatch = text.match(/(\d+)\s*ba[ñn]o/i);
    const bathrooms = banoMatch ? parseInt(banoMatch[1]) : null;

    const camaMatch = text.match(/(\d+)\s*cama/i);
    const beds = camaMatch ? parseInt(camaMatch[1]) : null;

    const propDir = path.join(CONFIG.outputDir, `${slugify(data.titulo)}_${slug}`);
    ensureDir(propDir);

    // Download images
    const images: any[] = [];
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const ext = img.src.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
      const fn = `img_${i + 1}.${ext}`;
      try {
        await downloadFile(img.src, path.join(propDir, fn));
        images.push({ url: img.src, alt: img.alt, orden: i + 1, esPrincipal: i === 0, archivoLocal: fn });
      } catch {
        images.push({ url: img.src, alt: img.alt, orden: i + 1, esPrincipal: i === 0, archivoLocal: "" });
      }
    }

    const result = {
      id: slug, slug: slugify(data.titulo), url: `https://estei.app/stay/${slug}/profile`,
      scrapedAt: new Date().toISOString(), titulo: data.titulo,
      descripcion: desc, tipoPropiedad: "APARTAMENTO",
      precioPorNoche: price, precioOriginal: price ? `$${price} USD` : "",
      moneda: "USD", capacidadMaxima: capacity,
      habitaciones: bedrooms, banos: bathrooms, camas: beds,
      direccion: data.location, ciudad: "", estado: "",
      latitud: null, longitud: null,
      reglas: null, politicaCancelacion: "",
      horarioCheckIn: "15:00", horarioCheckOut: "11:00",
      estanciaMinima: 1, estanciaMaxima: 365,
      amenidades: [], anfitrion: { nombre: null, imagen: null, miembroDesde: null, telefono: null, email: null, whatsapp: null },
      imagenes: images,
    };

    saveJSON(path.join(propDir, "data.json"), result);
    return result;
  } catch { return null; }
  finally { await page.close(); }
}

async function main() {
  console.log("Estei.app Scraper DOM\n" + "=".repeat(50));
  ensureDir(CONFIG.outputDir);
  const index: IndexEntry[] = loadJSON(CONFIG.indexFile, []);
  const known = new Set(index.map(p => p.id));
  console.log(`En indice: ${known.size} | Objetivo: ${CONFIG.targetCount}`);

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  try {
    // Discover
    console.log("\n--- Descubrimiento ---");
    const allIds = await discoverUrls(ctx, known);
    const newIds = allIds.filter(id => !known.has(id));
    console.log(`Nuevas: ${newIds.length} | Total: ${allIds.size}`);
    saveJSON(path.join(__dirname, "discovered_ids.json"), allIds);

    // Scrape
    console.log("\n--- Scraping ---");
    let scraped = 0, failed = 0;
    for (let i = 0; i < newIds.length; i++) {
      const slug = newIds[i];
      const data = await scrapePropertyFromDOM(ctx, slug);
      if (data) {
        index.push({ id: slug, slug: data.slug, titulo: data.titulo, url: data.url, carpeta: `${data.slug}_${slug}`, scrapedAt: data.scrapedAt });
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}/${newIds.length}] ${data.titulo} | $${data.precioPorNoche||"?"} | ${data.imagenes.length}imgs`);
      } else { failed++; console.log(`[${i+1}/${newIds.length}] FAIL: ${slug}`); }
      await sleep(500);
      if (scraped >= CONFIG.targetCount) break;
    }

    console.log(`\n${"=".repeat(50)}\nRESUMEN: ${scraped} scrapeados, ${failed} fallos, ${index.length} total`);
  } finally { await browser.close(); }
}

main().catch(console.error);
