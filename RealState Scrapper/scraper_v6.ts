import { chromium, type BrowserContext } from "playwright";
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
    "Barquisimeto", "Valencia", "Maracaibo",
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

// ─── Extract structured data from DOM ───
async function extractFromDOM(page: any) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

    // ── Title ──
    const regIdx = lines.findIndex((l: string) => l === "Registrarse");
    const titulo = regIdx >= 0 ? lines[regIdx + 1] || "" : "";

    // ── Location ──
    const location = regIdx >= 0 ? lines[regIdx + 2] || "" : "";

    // ── Description: between "Descripción" and "Mostrar más" or first section header ──
    const descStart = lines.findIndex((l: string) => l === "Descripción");
    let description = "";
    if (descStart >= 0) {
      const headers = ["Atributos del alojamiento", "Capacidad", "Comodidades", "Información", "Anfitrión", "Disponibilidad", "Mapas", "Políticas", "Servicios Adicionales", "Conoce a tu anfitrión"];
      let descEnd = lines.length;
      for (let i = descStart + 1; i < lines.length; i++) {
        if (headers.some(h => lines[i] === h)) { descEnd = i; break; }
        if (lines[i] === "Mostrar más") { descEnd = i; break; }
      }
      description = lines.slice(descStart + 1, descEnd).join(" ").trim();
    }

    // ── Amenities: lines between "Atributos del alojamiento" and "Horarios" ──
    const amenStart = lines.findIndex((l: string) => l === "Atributos del alojamiento");
    const amenEnd = lines.findIndex((l: string, i: number) => i > amenStart && l === "Horarios");
    const amenities = amenStart >= 0 && amenEnd >= 0
      ? lines.slice(amenStart + 1, amenEnd).filter((l: string) => l.length >= 2 && l.length <= 40)
      : [];

    // ── Check in/out: find label, next line is the time ──
    const checkInIdx = lines.findIndex((l: string) => l === "Check-in:");
    const checkIn = checkInIdx >= 0 ? lines[checkInIdx + 1] || null : null;
    const checkOutIdx = lines.findIndex((l: string) => l === "Check-out:");
    const checkOut = checkOutIdx >= 0 ? lines[checkOutIdx + 1] || null : null;

    // ── Host: find "Conoce a tu anfitrión", next line is the name ──
    const hostIdx = lines.findIndex((l: string) => l === "Conoce a tu anfitrión");
    const hostName = hostIdx >= 0 ? lines[hostIdx + 1] || null : null;

    // ── Price ──
    const priceMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)\s*\/?\s*noche/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

    // ── Capacity ──
    const capMatch = text.match(/(\d+)\s*viajero/i);
    const capacity = capMatch ? parseInt(capMatch[1]) : null;

    // ── Rooms ──
    const habMatch = text.match(/(\d+)\s*(?:habitaci[oó]n|recámara)/i);
    const bedrooms = habMatch ? parseInt(habMatch[1]) : null;
    const banoMatch = text.match(/(\d+)\s*ba[ñn]o/i);
    const bathrooms = banoMatch ? parseInt(banoMatch[1]) : null;
    const camaMatch = text.match(/(\d+)\s*cama/i);
    const beds = camaMatch ? parseInt(camaMatch[1]) : null;

    // ── Images ──
    const images = Array.from(document.querySelectorAll("img"))
      .filter((img: any) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
      .map((img: any) => ({ src: img.src, alt: img.alt || "" }));

    return {
      titulo, location, description, price, capacity,
      bedrooms, bathrooms, beds, amenities, hostName,
      images, checkIn, checkOut,
    };
  });
}

// ─── Discover URLs ───
async function discoverUrls(ctx: BrowserContext, knownIds: Set<string>): Promise<string[]> {
  const allIds = new Set<string>(knownIds);
  for (const loc of CONFIG.locations) {
    const page = await ctx.newPage();
    try {
      await page.goto("https://estei.app/search", { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(3000);
      try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await sleep(300); } } catch {}
      const input = page.locator('input[placeholder*="dónde"]').first();
      await input.click(); await input.type(loc, { delay: 30 });
      await sleep(1500); await input.press("ArrowDown"); await sleep(300); await input.press("Enter"); await sleep(1000);
      const btn = page.locator("button").filter({ hasText: "Buscar" }).last();
      await btn.click({ timeout: 5000, force: true });
      await sleep(8000);
      for (let pg = 0; pg < CONFIG.maxPagesPerLocation; pg++) {
        for (let i = 0; i < 5; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(800); }
        await sleep(1500);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a: any) => a.href)
        );
        for (const l of links) { const m = l.match(/stay\/(\d+)/); if (m) allIds.add(m[1]); }
        const nextBtn = page.locator("button").filter({ hasText: "Siguiente" });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click({ force: true }); await sleep(5000);
        } else break;
      }
      console.log(`  ${loc}: ${allIds.size} total`);
    } catch { console.log(`  ${loc}: ERROR`); }
    finally { await page.close(); }
  }
  return Array.from(allIds);
}

// ─── Scrape single property ───
async function scrapeProperty(ctx: BrowserContext, slug: string): Promise<any | null> {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
    try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await sleep(200); } } catch {}
    await page.waitForFunction(() => {
      const sp = document.querySelector('[data-testid="three-dots-loading"]');
      return !sp?.isConnected;
    }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      const lines = text.split("\n").filter((l: string) => l.trim());
      const regIdx = lines.findIndex((l: string) => l.includes("Registrarse"));
      if (regIdx < 0) return false;
      return lines.slice(regIdx + 1, regIdx + 10).some((l: string) => l.length > 10 && !l.includes("No se encontró"));
    }, { timeout: 15000 }).catch(() => {});
    await sleep(1000);

    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes("No se encontró el alojamiento")) return null;

    const data = await extractFromDOM(page);
    if (!data.titulo || data.titulo.length < 3) return null;

    const propDir = path.join(CONFIG.outputDir, `${slugify(data.titulo)}_${slug}`);
    ensureDir(propDir);
    const imgs = data.images.map((img: any, i: number) => ({
      url: img.src, alt: img.alt, orden: i + 1, esPrincipal: i === 0, archivoLocal: "",
    }));

    const result = {
      id: slug, slug: slugify(data.titulo), url: `https://estei.app/stay/${slug}/profile`,
      scrapedAt: new Date().toISOString(), titulo: data.titulo,
      descripcion: data.description, tipoPropiedad: "APARTAMENTO",
      precioPorNoche: data.price, precioOriginal: data.price ? `$${data.price} USD` : "",
      moneda: "USD", capacidadMaxima: data.capacity,
      habitaciones: data.bedrooms, banos: data.bathrooms, camas: data.beds,
      direccion: data.location, ciudad: "", estado: "",
      latitud: null, longitud: null,
      reglas: null, politicaCancelacion: "",
      horarioCheckIn: data.checkIn || "15:00", horarioCheckOut: data.checkOut || "11:00",
      estanciaMinima: 1, estanciaMaxima: 365,
      amenidades: data.amenities,
      anfitrion: { nombre: data.hostName, imagen: null, miembroDesde: null, telefono: null, email: null, whatsapp: null },
      imagenes: imgs,
    };
    saveJSON(path.join(propDir, "data.json"), result);
    return result;
  } catch (e: any) {
    return null;
  } finally { await page.close(); }
}

async function main() {
  console.log("Estei.app Scraper v6\n" + "=".repeat(50));
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
    console.log("\n--- Descubrimiento ---");
    const allIds = await discoverUrls(ctx, known);
    const newIds = allIds.filter(id => !known.has(id));
    console.log(`Nuevas: ${newIds.length} | Total: ${allIds.size}`);
    saveJSON(path.join(__dirname, "discovered_ids.json"), allIds);

    await ctx.close();
    const scrapeCtx = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });
    await scrapeCtx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

    console.log("\n--- Scraping ---");
    let scraped = 0, failed = 0;
    for (let i = 0; i < newIds.length; i++) {
      const slug = newIds[i];
      const data = await scrapeProperty(scrapeCtx, slug);
      if (data) {
        index.push({ id: slug, slug: data.slug, titulo: data.titulo, url: data.url, carpeta: `${data.slug}_${slug}`, scrapedAt: data.scrapedAt });
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}/${Math.min(newIds.length, CONFIG.targetCount)}] ${data.titulo} | $${data.precioPorNoche||"?"} | ${data.imagenes.length}imgs | ${data.amenidades.length}amen`);
      } else { failed++; console.log(`[${i+1}] FAIL: ${slug}`); }
      await sleep(300);
      if (scraped >= CONFIG.targetCount) break;
    }

    console.log(`\n${"=".repeat(50)}\nRESUMEN: ${scraped} scrapeados, ${failed} fallos, ${index.length} total`);
  } finally { await browser.close(); }
}

main().catch(console.error);
