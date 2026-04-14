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
        for (const l of links) { const m = l.match(/stay\/(\d+)/); if (m) allIds.add(m[1]); }

        const nextBtn = page.locator("button").filter({ hasText: "Siguiente" });
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click({ force: true });
          await sleep(5000);
        } else break;
      }

      console.log(`  ${loc}: ${allIds.size} total`);
    } catch { console.log(`  ${loc}: ERROR`); }
    finally { await page.close(); }
  }

  return Array.from(allIds);
}

async function scrapeProperty(ctx: BrowserContext, slug: string): Promise<any | null> {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Accept cookies
    try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await sleep(200); } } catch {}

    // Wait for spinner to disappear
    await page.waitForFunction(() => {
      const sp = document.querySelector('[data-testid="three-dots-loading"]');
      return !sp?.isConnected;
    }, { timeout: 20000 }).catch(() => {});

    // Wait for property content
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      const lines = text.split("\n").filter((l: string) => l.trim());
      const regIdx = lines.findIndex((l: string) => l.includes("Registrarse"));
      if (regIdx < 0) return false;
      return lines.slice(regIdx + 1, regIdx + 10).some((l: string) => l.length > 10 && !l.includes("No se encontró"));
    }, { timeout: 15000 }).catch(() => {});

    await sleep(1000);

    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes("No se encontró el alojamiento")) {
      console.log(`    [DEBUG] Page shows "No se encontró" - maybe needs more wait`);
      return null;
    }

    const lines = text.split("\n").filter((l: string) => l.trim());

    // Title
    const regIdx = lines.findIndex((l: string) => l.includes("Registrarse"));
    const titulo = regIdx >= 0 ? lines[regIdx + 1]?.trim() : "";
    if (!titulo || titulo.length < 3) {
      console.log(`    [DEBUG] No title found. Lines: ${lines.slice(0, 8).join(" | ")}`);
      return null;
    }

    // Location
    const locIdx = regIdx + 2;
    const location = lines[locIdx]?.trim() || "";

    // Price
    const priceMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)\s*(?:USD|noche|\/\s*noche)/i) ||
      text.match(/(\d+(?:[.,]\d+)?)\s*USD\s*(?:\/\s*noche|noche)/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

    // Description
    const descMatch = text.match(/Descripción\s*\n([\s\S]*?)(?:\nCapacidad|\nAtributos|\nComodidades)/);
    const desc = descMatch ? descMatch[1].trim() : "";

    // Capacity
    const capMatch = text.match(/(\d+)\s*viajero/i);
    const capacity = capMatch ? parseInt(capMatch[1]) : null;

    // Rooms
    const habMatch = text.match(/(\d+)\s*(?:habitaci[oó]n|recámara)/i);
    const bedrooms = habMatch ? parseInt(habMatch[1]) : null;
    const banoMatch = text.match(/(\d+)\s*ba[ñn]o/i);
    const bathrooms = banoMatch ? parseInt(banoMatch[1]) : null;
    const camaMatch = text.match(/(\d+)\s*cama/i);
    const beds = camaMatch ? parseInt(camaMatch[1]) : null;

    // Amenities
    const attrMatch = text.match(/Atributos del alojamiento\s*\n([\s\S]*?)(?:\nInformación|$)/);
    const amenities = attrMatch ? attrMatch[1].split("\n").map((a: string) => a.trim()).filter((a: string) => a.length > 1 && a.length < 50) : [];

    // Host info
    const hostMatch = text.match(/Anfitri[oó]n[\s\S]*?Nombre[:\s]+([^\n]+)/i) ||
      text.match(/(?:Presenta el espacio|Reservar con)[:\s]*\n*([^\n]{3,40})/i);
    const hostName = hostMatch ? hostMatch[1].trim() : null;
    const hostEmailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const hostEmail = hostEmailMatch ? hostEmailMatch[0] : null;

    // Property type
    const typeMatch = text.match(/(?:Tipo de alojamiento|Tipo)[:\s]+([^\n]+)/i);
    const propType = typeMatch ? typeMatch[1].trim() : "APARTAMENTO";

    // Check in/out
    const checkInMatch = text.match(/(?:Check-?[Ii]n|Entrada)[:\s]*(\d{1,2}:\d{2})/i);
    const checkOutMatch = text.match(/(?:Check-?[Oo]ut|Salida)[:\s]*(\d{1,2}:\d{2})/i);

    // Images
    const images = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
        .map((img) => ({ src: img.src, alt: img.alt || "" }))
    );

    // Save images (URLs only, skip download for speed)
    const propDir = path.join(CONFIG.outputDir, `${slugify(titulo)}_${slug}`);
    ensureDir(propDir);
    const imgs = images.map((img: any, i: number) => ({
      url: img.src, alt: img.alt, orden: i + 1, esPrincipal: i === 0, archivoLocal: "",
    }));

    const result = {
      id: slug, slug: slugify(titulo), url: `https://estei.app/stay/${slug}/profile`,
      scrapedAt: new Date().toISOString(), titulo,
      descripcion: desc, tipoPropiedad: propType,
      precioPorNoche: price, precioOriginal: price ? `$${price} USD` : "",
      moneda: "USD", capacidadMaxima: capacity,
      habitaciones: bedrooms, banos: bathrooms, camas: beds,
      direccion: location, ciudad: "", estado: "",
      latitud: null, longitud: null,
      reglas: null, politicaCancelacion: "",
      horarioCheckIn: checkInMatch ? checkInMatch[1] : "15:00",
      horarioCheckOut: checkOutMatch ? checkOutMatch[1] : "11:00",
      estanciaMinima: 1, estanciaMaxima: 365,
      amenidades: amenities,
      anfitrion: {
        nombre: hostName, imagen: null, miembroDesde: null,
        telefono: null, email: hostEmail, whatsapp: null,
      },
      imagenes: imgs,
    };

    saveJSON(path.join(propDir, "data.json"), result);
    return result;
  } catch (e: any) {
    console.log(`    [DEBUG] Error: ${e.message?.slice(0, 120)}`);
    return null;
  }
  finally { await page.close(); }
}

async function main() {
  console.log("Estei.app Final Scraper\n" + "=".repeat(50));
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

    console.log("\n--- Scraping ---");
    await ctx.close(); // Release discovery context
    const scrapeCtx = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });
    await scrapeCtx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
    let scraped = 0, failed = 0;
    for (let i = 0; i < newIds.length; i++) {
      const slug = newIds[i];
      const data = await scrapeProperty(scrapeCtx, slug);
      if (data) {
        index.push({ id: slug, slug: data.slug, titulo: data.titulo, url: data.url, carpeta: `${data.slug}_${slug}`, scrapedAt: data.scrapedAt });
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}/${Math.min(newIds.length, CONFIG.targetCount)}] ${data.titulo} | $${data.precioPorNoche||"?"} | ${data.imagenes.length}imgs | ${data.ciudad||data.direccion.slice(0,30)}`);
      } else { failed++; console.log(`[${i+1}] FAIL: ${slug}`); }
      await sleep(300);
      if (scraped >= CONFIG.targetCount) break;
    }

    console.log(`\n${"=".repeat(50)}\nRESUMEN: ${scraped} scrapeados, ${failed} fallos, ${index.length} total`);
  } finally { await browser.close(); }
}

main().catch(console.error);
