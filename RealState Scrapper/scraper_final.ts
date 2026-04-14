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
    "Barquisimeto", "Valencia", "Maracaibo", "Puerto La Cruz",
    "Maracay", "Porlamar", "Cumana", "Merida", "San Cristobal",
    "Puerto Ayacucho", "Isla de Coche", "Pampatar", "Choroni",
    "Morrocoy", "Los Roques", "Ciudad Bolivar", "Coro", "Puerto Cabello",
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

async function searchLocation(ctx: BrowserContext, location: string): Promise<string[]> {
  const page = await ctx.newPage();
  const allLinks: string[] = [];
  try {
    await page.goto("https://estei.app/search", { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(3000);

    // Accept cookies
    try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await sleep(300); } } catch {}

    // Type location and search
    const input = page.locator('input[placeholder*="dónde"]').first();
    await input.click();
    await input.type(location, { delay: 30 });
    await sleep(1500);
    await input.press("ArrowDown");
    await sleep(300);
    await input.press("Enter");
    await sleep(1000);

    const btn = page.locator("button").filter({ hasText: "Buscar" }).last();
    await btn.click({ timeout: 5000, force: true });
    await sleep(8000);

    // Scroll and collect pages
    for (let pg = 0; pg < CONFIG.maxPagesPerLocation; pg++) {
      // Scroll
      for (let i = 0; i < 5; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(800); }
      await sleep(1500);

      // Collect links
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
      );
      for (const l of links) {
        if (!allLinks.includes(l)) allLinks.push(l);
      }

      // Check for "Siguiente" button
      const nextBtn = page.locator("button").filter({ hasText: "Siguiente" });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click({ force: true });
        await sleep(5000);
      } else {
        break;
      }
    }

    console.log(`  ${location}: ${allLinks.length} propiedades`);
  } catch (e: any) {
    console.log(`  ${location}: ERROR ${e.message?.slice(0, 60)}`);
  } finally {
    await page.close();
  }
  return allLinks;
}

async function scrapeProperty(ctx: BrowserContext, slug: string): Promise<any | null> {
  const query = `query GetStay($record: GetStayInput!) {
    getStay(record: $record) {
      _id slug title { es } description { es }
      address city state country latitude longitude
      pricePerNight maxGuests bedrooms bathrooms beds
      checkInTime checkOutTime minStay maxStay
      cancellationPolicy houseRules propertyType
      amenities { name } host { name email phone memberSince }
      images { url alt }
    }
  }`;
  const page = await ctx.newPage();
  try {
    await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(500);
    const r = await page.evaluate(async ({ q, v }) => {
      try { const res = await fetch("https://api.estei.app/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operationName: "GetStay", query: q, variables: v }) }); return await res.json(); }
      catch (e: any) { return { error: e.message }; }
    }, { q: query, v: { record: { slug, useCase: "bookingPreview" } } });
    if (r?.errors) return null;
    const s = r?.data?.getStay;
    if (!s?._id) return null;

    const d = path.join(CONFIG.outputDir, `${slugify(s.title?.es||slug)}_${s.slug}`);
    ensureDir(d);
    const imgs: any[] = [];
    for (let i = 0; i < (s.images||[]).length; i++) {
      const img = s.images[i]; if (!img.url) continue;
      const ext = img.url.match(/\.(jpg|jpeg|png|webp)/i)?.[1]||"jpg";
      const fn = `img_${i+1}.${ext}`;
      try { await downloadFile(img.url, path.join(d, fn)); imgs.push({ url: img.url, alt: img.alt||"", orden: i+1, esPrincipal: i===0, archivoLocal: fn }); }
      catch { imgs.push({ url: img.url, alt: img.alt||"", orden: i+1, esPrincipal: i===0, archivoLocal: "" }); }
    }
    return {
      id: s.slug, slug: slugify(s.title?.es||slug), url: `https://estei.app/stay/${s.slug}/profile`,
      scrapedAt: new Date().toISOString(), titulo: s.title?.es||"Sin titulo",
      descripcion: s.description?.es||"", tipoPropiedad: s.propertyType||"APARTAMENTO",
      precioPorNoche: s.pricePerNight||null, precioOriginal: s.pricePerNight?`$${s.pricePerNight} USD`:"",
      moneda:"USD", capacidadMaxima: s.maxGuests||null, habitaciones: s.bedrooms||null,
      banos: s.bathrooms||null, camas: s.beds||null, direccion: s.address||"",
      ciudad: s.city||"", estado: s.state||"", latitud: s.latitude||null, longitud: s.longitude||null,
      reglas: s.houseRules||null, politicaCancelacion: s.cancellationPolicy||"",
      horarioCheckIn: s.checkInTime||"15:00", horarioCheckOut: s.checkOutTime||"11:00",
      estanciaMinima: s.minStay||1, estanciaMaxima: s.maxStay||365,
      amenidades: (s.amenities||[]).map((a:any)=>a.name),
      anfitrion: { nombre: s.host?.name||null, imagen: null, miembroDesde: s.host?.memberSince||null, telefono: s.host?.phone||null, email: s.host?.email||null, whatsapp: null },
      imagenes: imgs,
    };
  } catch { return null; } finally { await page.close(); }
}

async function main() {
  console.log("Estei.app Scraper Final\n"+"=".repeat(50));
  ensureDir(CONFIG.outputDir);
  const index: IndexEntry[] = loadJSON(CONFIG.indexFile, []);
  const errors: any[] = loadJSON(CONFIG.errorFile, []);
  const known = new Set(index.map(p => p.id));
  console.log(`En indice: ${known.size} | Objetivo: ${CONFIG.targetCount}`);

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  try {
    // Phase 1: Discover
    console.log("\n--- Descubrimiento ---");
    const allIds = new Set<string>();
    for (const loc of CONFIG.locations) {
      if (allIds.size >= CONFIG.targetCount) break;
      const links = await searchLocation(ctx, loc);
      for (const l of links) { const m = l.match(/stay\/(\d+)/); if (m) allIds.add(m[1]); }
      console.log(`    Total: ${allIds.size}`);
    }

    const newIds = Array.from(allIds).filter(id => !known.has(id));
    console.log(`\n  Total descubiertas: ${allIds.size} | Nuevas: ${newIds.length}`);
    saveJSON(path.join(__dirname, "discovered_ids.json"), Array.from(allIds));

    // Phase 2: Scrape
    console.log("\n--- Scraping ---");
    let scraped = 0, failed = 0;
    for (let i = 0; i < newIds.length; i++) {
      const slug = newIds[i];
      const data = await scrapeProperty(ctx, slug);
      if (data) {
        index.push({ id: slug, slug: data.slug, titulo: data.titulo, url: data.url, carpeta: `${data.slug}_${slug}`, scrapedAt: data.scrapedAt });
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`[${scraped}] ${data.titulo} | $${data.precioPorNoche||"?"} | ${data.imagenes.length}imgs | ${data.ciudad||"?"}`);
      } else { failed++; console.log(`[${i+1}] FAIL: ${slug}`); }
      await sleep(500);
    }

    console.log("\n"+ "=".repeat(50));
    console.log(`RESUMEN: ${scraped} scrapeados, ${failed} fallos, ${index.length} total en indice`);
  } finally { await browser.close(); }
}

main().catch(console.error);
