import { chromium, type BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  targetCount: 200,
  outputDir: path.join(__dirname, "properties"),
  indexFile: path.join(__dirname, "index.json"),
  errorFile: path.join(__dirname, "errors.json"),
  searchLocations: [
    "Caracas", "Margarita", "La+Guaira", "Vargas", "Valencia",
    "Maracaibo", "Venezuela", "Falcon", "Merida", "Barquisimeto",
    "Maracay", "Porlamar", "Pampatar", "Choroni", "Puerto+La+Cruz",
    "Cumana", "Coro", "Puerto+Cabello", "Morrocoy", "Los+Roques",
    "Isla+de+Coche", "Canaima", " Ciudad+Bolivar",
  ],
};

interface IndexEntry {
  id: string;
  slug: string;
  titulo: string;
  url: string;
  carpeta: string;
  scrapedAt: string;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function ensureDir(dir: string) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function saveJSON(fp: string, data: unknown) { ensureDir(path.dirname(fp)); fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8"); }
function loadJSON<T>(fp: string, fallback: T): T { try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch {} return fallback; }

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const mod = url.startsWith("https") ? https : (require("http") as typeof import("http"));
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        file.close(); fs.unlink(dest, () => {}); downloadFile(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file); file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
  });
}

async function discoverPropertyUrls(ctx: BrowserContext, knownIds: Set<string>): Promise<string[]> {
  const allUrls = new Set<string>();
  const searchUrl = (loc: string) =>
    `https://estei.app/search?location=${loc}&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;

  for (const loc of CONFIG.searchLocations) {
    console.log(`  Buscando en: ${loc.replace(/\+/g, " ")}`);
    const page = await ctx.newPage();
    try {
      await page.goto(searchUrl(loc), { waitUntil: "domcontentloaded", timeout: 30000 });

      // Accept cookies if visible
      try {
        const btn = page.locator('button:has-text("Aceptar")');
        if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await sleep(500); }
      } catch {}

      // Wait for content to load
      await page.waitForSelector('[data-testid="three-dots-loading"]', { timeout: 10000 }).catch(() => {});
      await sleep(3000);
      await page.waitForFunction(() => {
        const spinner = document.querySelector('[data-testid="three-dots-loading"]');
        return !spinner?.isConnected;
      }, { timeout: 15000 }).catch(() => {});
      await sleep(2000);

      // Click search button
      const searchBtn = page.locator("button").filter({ hasText: "Buscar" }).last();
      try { await searchBtn.click({ timeout: 3000, force: true }); } catch {}
      await sleep(5000);

      // Wait for results
      await page.waitForFunction(() => {
        const spinner = document.querySelector('[data-testid="three-dots-loading"]');
        return !spinner?.isConnected;
      }, { timeout: 15000 }).catch(() => {});
      await sleep(3000);

      // Scroll to load more
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(1500);
      }

      // Extract stay links
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
      );

      for (const link of links) {
        const m = link.match(/stay\/(\d+)/);
        if (m) allUrls.add(m[1]);
      }

      console.log(`    ${links.length} propiedades encontradas (total: ${allUrls.size})`);
    } catch (e: any) {
      console.log(`    Error: ${e.message?.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  return Array.from(allUrls);
}

async function scrapeProperty(ctx: BrowserContext, slug: string): Promise<any | null> {
  const query = `query GetStay($record: GetStayInput!) {
    getStay(record: $record) {
      _id slug
      title { es en }
      description { es en }
      address city state country
      latitude longitude
      pricePerNight maxGuests bedrooms bathrooms beds
      checkInTime checkOutTime
      minStay maxStay
      cancellationPolicy
      houseRules
      propertyType
      amenities { name }
      host { name email phone memberSince }
      images { url alt }
    }
  }`;

  const page = await ctx.newPage();
  try {
    await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(1000);

    const result = await page.evaluate(
      async ({ q, v }) => {
        try {
          const res = await fetch("https://api.estei.app/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName: "GetStay", query: q, variables: v }),
          });
          return await res.json();
        } catch (e: any) { return { error: e.message }; }
      },
      { q: query, v: { record: { slug, useCase: "bookingPreview" } } }
    );

    if (result?.errors) return null;
    const stay = result?.data?.getStay;
    if (!stay || !stay._id) return null;

    const propDir = path.join(CONFIG.outputDir, `${slugify(stay.title?.es || slug)}_${stay.slug}`);
    ensureDir(propDir);

    const images: any[] = [];
    const downloadable = (stay.images || []).filter(
      (img: any) => img.url && (img.url.includes("imagekit") || img.url.includes("digitaloceanspaces"))
    );

    for (let i = 0; i < downloadable.length; i++) {
      const img = downloadable[i];
      const ext = img.url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
      const filename = `img_${i + 1}.${ext}`;
      const filepath = path.join(propDir, filename);
      try {
        await downloadFile(img.url, filepath);
        images.push({ url: img.url, alt: img.alt || "", orden: i + 1, esPrincipal: i === 0, archivoLocal: filename });
      } catch {
        images.push({ url: img.url, alt: img.alt || "", orden: i + 1, esPrincipal: i === 0, archivoLocal: "" });
      }
    }

    const data = {
      id: stay.slug, slug: slugify(stay.title?.es || slug),
      url: `https://estei.app/stay/${stay.slug}/profile`,
      scrapedAt: new Date().toISOString(),
      titulo: stay.title?.es || "Sin titulo",
      descripcion: stay.description?.es || "",
      tipoPropiedad: stay.propertyType || "APARTAMENTO",
      precioPorNoche: stay.pricePerNight || null,
      precioOriginal: stay.pricePerNight ? `$${stay.pricePerNight} USD` : "",
      moneda: "USD", capacidadMaxima: stay.maxGuests || null,
      habitaciones: stay.bedrooms || null, banos: stay.bathrooms || null, camas: stay.beds || null,
      direccion: stay.address || "", ciudad: stay.city || "", estado: stay.state || "",
      latitud: stay.latitude || null, longitud: stay.longitude || null,
      reglas: stay.houseRules || null, politicaCancelacion: stay.cancellationPolicy || "",
      horarioCheckIn: stay.checkInTime || "15:00", horarioCheckOut: stay.checkOutTime || "11:00",
      estanciaMinima: stay.minStay || 1, estanciaMaxima: stay.maxStay || 365,
      amenidades: (stay.amenities || []).map((a: any) => a.name),
      anfitrion: { nombre: stay.host?.name || null, imagen: null, miembroDesde: stay.host?.memberSince || null,
        telefono: stay.host?.phone || null, email: stay.host?.email || null, whatsapp: null },
      imagenes: images,
    };

    saveJSON(path.join(propDir, "data.json"), data);
    return data;
  } catch (e: any) {
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("Estei.app Property Scraper v3");
  console.log("=".repeat(50));

  ensureDir(CONFIG.outputDir);
  const index: IndexEntry[] = loadJSON(CONFIG.indexFile, []);
  const errors: { url: string; error: string; date: string }[] = loadJSON(CONFIG.errorFile, []);
  const scrapedIds = new Set(index.map((p) => p.id));

  console.log(`\nYa scrapeadas: ${scrapedIds.size}, Objetivo: ${CONFIG.targetCount}`);

  console.log("\nIniciando navegador...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  try {
    // Phase 1: Discover URLs
    console.log("\nFase 1: Descubriendo URLs...");
    const allIds = await discoverPropertyUrls(ctx, scrapedIds);
    const newIds = allIds.filter((id) => !scrapedIds.has(id));
    console.log(`\nDescubiertas: ${newIds.length} nuevas / ${allIds.length} total`);

    saveJSON(path.join(__dirname, "discovered_ids.json"), allIds);

    // Phase 2: Scrape
    console.log(`\nFase 2: Scrapeando ${newIds.length} propiedades...`);
    let scraped = 0;
    let failed = 0;

    for (let i = 0; i < newIds.length && scraped < CONFIG.targetCount; i++) {
      const slug = newIds[i];
      console.log(`\n[${scraped + 1}/${Math.min(newIds.length, CONFIG.targetCount)}] ${slug}`);

      const data = await scrapeProperty(ctx, slug);

      if (data) {
        index.push({ id: slug, slug: data.slug, titulo: data.titulo, url: data.url,
          carpeta: `${data.slug}_${slug}`, scrapedAt: data.scrapedAt });
        saveJSON(CONFIG.indexFile, index);
        scraped++;
        console.log(`    OK: ${data.titulo} - $${data.precioPorNoche || "?"} - ${data.imagenes.length} imgs - ${data.ciudad}`);
      } else {
        errors.push({ url: slug, error: "Scraping failed", date: new Date().toISOString() });
        saveJSON(CONFIG.errorFile, errors);
        failed++;
        console.log(`    FAIL`);
      }

      if (i < newIds.length - 1) await sleep(800);
    }

    console.log("\n" + "=".repeat(50));
    console.log("RESUMEN");
    console.log("=".repeat(50));
    console.log(`Propiedades scrapeadas: ${scraped}`);
    console.log(`Errores: ${failed}`);
    console.log(`Total en indice: ${index.length}`);
  } catch (err: any) {
    console.error(`\nError fatal: ${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
