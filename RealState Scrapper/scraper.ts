import { chromium, type BrowserContext, type Page, type Response } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface ScrapedImage {
  url: string;
  alt: string;
  orden: number;
  esPrincipal: boolean;
  archivoLocal: string;
}

interface HostInfo {
  nombre: string | null;
  imagen: string | null;
  miembroDesde: string | null;
  telefono: string | null;
  email: string | null;
  whatsapp: string | null;
}

interface PropertyData {
  id: string;
  slug: string;
  url: string;
  scrapedAt: string;
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  precioPorNoche: number | null;
  precioOriginal: string;
  moneda: string;
  capacidadMaxima: number | null;
  habitaciones: number | null;
  banos: number | null;
  camas: number | null;
  direccion: string;
  ciudad: string;
  estado: string;
  zona: string | null;
  latitud: number | null;
  longitud: number | null;
  reglas: string | null;
  politicaCancelacion: string;
  horarioCheckIn: string;
  horarioCheckOut: string;
  estanciaMinima: number;
  estanciaMaxima: number;
  amenidades: string[];
  anfitrion: HostInfo;
  imagenes: ScrapedImage[];
}

interface ContactData {
  telefonos: string[];
  emails: string[];
  whatsapp: string | null;
  redesSociales: { plataforma: string; url: string }[];
  urlPerfilAnfitrion: string | null;
  metodoPrincipal: string | null;
  notas: string[];
  rawMatches: { tipo: string; valor: string; fuente: string }[];
}

interface CapturedResponse {
  url: string;
  status: number;
  body: unknown;
  contentType: string;
}

interface IndexEntry {
  id: string;
  slug: string;
  titulo: string;
  url: string;
  carpeta: string;
  scrapedAt: string;
}

interface DOMData {
  titulo: string;
  descripcion: string;
  precioPorNoche: number | null;
  precioOriginal: string;
  tipoPropiedad: string;
  capacidadMaxima: number | null;
  habitaciones: number | null;
  banos: number | null;
  camas: number | null;
  direccion: string;
  ciudad: string;
  estado: string;
  zona: string | null;
  latitud: number | null;
  longitud: number | null;
  horarioCheckIn: string;
  horarioCheckOut: string;
  amenidades: string[];
  imageUrls: { src: string; alt: string }[];
  allLinks: { href: string; text: string }[];
  fullText: string;
  anfitrionSection: string | null;
  reglas: string | null;
}

// ═══════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════

const CONFIG = {
  baseUrl: "https://estei.app",
  headless: true,
  timeout: 45000,
  delays: {
    pageLoad: 5000,
    betweenRequests: 2000,
    afterScroll: 1500,
  },
  outputDir: path.join(__dirname, "properties"),
  indexFile: path.join(__dirname, "index.json"),
  errorFile: path.join(__dirname, "errors.json"),
  rawCaptureFile: path.join(__dirname, "raw_captures"),
  searchLocations: [
    "Caracas",
    "Margarita",
    "La Guaira",
    "Vargas",
    "Valencia",
    "Maracaibo",
    "Venezuela",
  ],
  imageHosts: ["ik.imagekit.io", "avilatek.sfo3.digitaloceanspaces.com"],
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
};

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function extractPropertyId(url: string): string {
  const m = url.match(/\/stay\/(\d+)/);
  return m ? m[1] : Date.now().toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(d: string): void {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function isPropertyImage(url: string): boolean {
  return CONFIG.imageHosts.some((h) => url.includes(h));
}

function getImageExt(url: string): string {
  const m = url.match(/\.(jpg|jpeg|png|webp|avif)/i);
  return m ? m[1].toLowerCase() : "jpg";
}

function cleanImageUrl(url: string): string {
  if (url.includes("ik.imagekit.io")) {
    const base = url.split("?")[0];
    return `${base}?tr=w-1920,q-90`;
  }
  return url.split("?")[0] || url;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(
      url,
      {
        headers: {
          "User-Agent": CONFIG.userAgent,
          Referer: CONFIG.baseUrl,
        },
      },
      (res) => {
        if (
          (res.statusCode === 301 || res.statusCode === 302) &&
          res.headers.location
        ) {
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }
    ).on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadWithRetry(
  url: string,
  dest: string,
  retries = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await downloadFile(url, dest);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1500 * (i + 1));
    }
  }
}

function saveJSON(fp: string, data: unknown): void {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
}

function loadJSON<T>(fp: string, fallback: T): T {
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {}
  return fallback;
}

// ═══════════════════════════════════════════════════
// NETWORK CAPTURE
// ═══════════════════════════════════════════════════

function setupNetworkCapture(page: Page): CapturedResponse[] {
  const captured: CapturedResponse[] = [];

  page.on("response", async (response: Response) => {
    const url = response.url();
    const ct = response.headers()["content-type"] || "";

    const isJson =
      ct.includes("json") ||
      url.includes("/api/") ||
      url.includes("supabase") ||
      url.includes("rest/v1") ||
      url.includes("rpc");

    if (isJson) {
      try {
        const body = await response.json();
        captured.push({
          url,
          status: response.status(),
          body,
          contentType: ct,
        });
      } catch {}
    }
  });

  return captured;
}

// ═══════════════════════════════════════════════════
// DOM EXTRACTION
// ═══════════════════════════════════════════════════

async function extractFromDOM(page: Page): Promise<DOMData> {
  return page.evaluate(() => {
    const result: any = {
      titulo: "",
      descripcion: "",
      precioPorNoche: null,
      precioOriginal: "",
      tipoPropiedad: "",
      capacidadMaxima: null,
      habitaciones: null,
      banos: null,
      camas: null,
      direccion: "",
      ciudad: "",
      estado: "",
      zona: null,
      latitud: null,
      longitud: null,
      horarioCheckIn: "15:00",
      horarioCheckOut: "11:00",
      amenidades: [],
      imageUrls: [],
      allLinks: [],
      fullText: "",
      anfitrionSection: null,
      reglas: null,
    };

    const allText = document.body.innerText;
    result.fullText = allText;

    // Title
    const h1 = document.querySelector("h1");
    if (h1) result.titulo = h1.textContent?.trim() || "";
    if (!result.titulo) {
      const h2 = document.querySelector("h2");
      if (h2) result.titulo = h2.textContent?.trim() || "";
    }

    // Description - find the longest meaningful paragraph block
    const descSelectors = [
      '[class*="escription"]',
      '[class*="detalle"]',
      '[class*="about"]',
      '[class*="About"]',
      "article p",
      '[class*="summary"]',
      '[class*="content"]',
    ];
    for (const sel of descSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const t = el.textContent?.trim() || "";
        if (t.length > 30 && t.length > (result.descripcion?.length || 0)) {
          result.descripcion = t;
        }
      }
    }

    // Price
    const pricePatterns = [
      /\$\s*(\d+(?:[.,]\d+)?)/,
      /(\d+(?:[.,]\d+)?)\s*USD/i,
      /USD\s*(\d+(?:[.,]\d+)?)/i,
      /(\d+(?:[.,]\d+)?)\s*\$/,
    ];
    for (const pat of pricePatterns) {
      const m = allText.match(pat);
      if (m) {
        result.precioPorNoche = parseFloat(m[1].replace(",", "."));
        result.precioOriginal = m[0];
        break;
      }
    }

    // Property type
    const types: Record<string, string> = {
      apartamento: "APARTAMENTO",
      casa: "CASA",
      hotel: "HOTEL",
      habitaci\u00f3n: "HABITACION",
      habitacion: "HABITACION",
      villa: "VILLA",
      estudio: "ESTUDIO",
      loft: "LOFT",
      caba\u00f1a: "CABANA",
      cabana: "CABANA",
      hostal: "HOSTAL",
      anexo: "ANEXO",
    };
    for (const [kw, val] of Object.entries(types)) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(allText)) {
        result.tipoPropiedad = val;
        break;
      }
    }

    // Rooms, baths, beds, capacity
    const numExtractors: [RegExp, string][] = [
      [/(\d+)\s*(?:habitaci[o\u00f3]n|hab\.|room)/i, "habitaciones"],
      [/(\d+)\s*(?:ba[o\u00f3]n|bath)/i, "banos"],
      [/(\d+)\s*(?:cama|bed)/i, "camas"],
      [/(\d+)\s*(?:persona|viajero|hue[s\u00e9]ped|guest)/i, "capacidadMaxima"],
      [/hasta\s*(\d+)\s*(?:persona|viajero)/i, "capacidadMaxima"],
    ];
    for (const [pat, field] of numExtractors) {
      const m = allText.match(pat);
      if (m) (result as any)[field] = parseInt(m[1]);
    }

    // Location
    const statePatterns = [
      "Distrito Capital",
      "Miranda",
      "Vargas",
      "La Guaira",
      "Nueva Esparta",
      "Margarita",
      "Carabobo",
      "Zulia",
      "Aragua",
      "T\u00e1chira",
      "Lara",
      "Bol\u00edvar",
    ];
    for (const st of statePatterns) {
      if (allText.includes(st)) {
        result.estado = st;
        break;
      }
    }

    const cityPatterns = [
      "Caracas",
      "Valencia",
      "Maracaibo",
      "Porlamar",
      "Pampatar",
      "La Guaira",
      "Catia La Mar",
      "Maiquet\u00eda",
    ];
    for (const c of cityPatterns) {
      if (allText.includes(c)) {
        result.ciudad = c;
        break;
      }
    }

    // Check-in/out
    const ciMatch = allText.match(/check[- ]?in[:\s]*(\d{1,2}[:.]\d{2})/i);
    if (ciMatch) result.horarioCheckIn = ciMatch[1].replace(".", ":");
    const coMatch = allText.match(/check[- ]?out[:\s]*(\d{1,2}[:.]\d{2})/i);
    if (coMatch) result.horarioCheckOut = coMatch[1].replace(".", ":");

    // Coordinates from data attributes or scripts
    const mapDiv = document.querySelector("[data-lat]") || document.querySelector("[data-latitude]");
    if (mapDiv) {
      result.latitud = parseFloat(mapDiv.getAttribute("data-lat") || mapDiv.getAttribute("data-latitude") || "0") || null;
      result.longitud = parseFloat(mapDiv.getAttribute("data-lng") || mapDiv.getAttribute("data-longitude") || "0") || null;
    }

    // Amenities
    const amenityKws = [
      "wifi",
      "wi-fi",
      "aire acondicionado",
      "ac",
      "estacionamiento",
      "parking",
      "piscina",
      "pool",
      "cocina",
      "kitchen",
      "lavadora",
      "washer",
      "secadora",
      "tv",
      "televisor",
      "agua caliente",
      "seguridad",
      "gym",
      "gimnasio",
      "pet friendly",
      "mascotas",
      "jardin",
      "balc\u00f3n",
      "balcon",
      "terraza",
      "patio",
      "bbq",
      "parrilla",
      "caja fuerte",
      "ascensor",
      "elevator",
      "nevera",
      "refrigerador",
      "microondas",
      "cafe",
      "toallas",
      "sabanas",
      "jabon",
      "shampoo",
    ];
    result.amenidades = amenityKws.filter((kw) =>
      new RegExp(`\\b${kw}\\b`, "i").test(allText)
    );

    // Images
    const imgs = Array.from(document.querySelectorAll("img"));
    result.imageUrls = imgs
      .map((img) => ({
        src:
          img.src ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy-src") ||
          "",
        alt: img.alt || "",
      }))
      .filter(
        (i) =>
          i.src &&
          !i.src.includes("mapsresources") &&
          !i.src.includes("googleapis.com/tiles") &&
          !i.src.includes("maps.google") &&
          !i.src.includes("gstatic") &&
          i.src.startsWith("http")
      );

    // Links
    result.allLinks = Array.from(document.querySelectorAll("a")).map((a) => ({
      href: (a as HTMLAnchorElement).href || "",
      text: a.textContent?.trim() || "",
    }));

    // Host section
    const hostEl =
      document.querySelector('[class*="host"]') ||
      document.querySelector('[class*="Host"]') ||
      document.querySelector('[class*="anfitrion"]');
    if (hostEl) result.anfitrionSection = hostEl.textContent?.trim() || null;

    // Rules
    const rulesEl =
      document.querySelector('[class*="rule"]') ||
      document.querySelector('[class*="regla"]');
    if (rulesEl) result.reglas = rulesEl.textContent?.trim() || null;

    return result as DOMData;
  });
}

// ═══════════════════════════════════════════════════
// CONTACT EXTRACTION
// ═══════════════════════════════════════════════════

function extractContacts(
  domData: DOMData,
  captured: CapturedResponse[]
): ContactData {
  const contact: ContactData = {
    telefonos: [],
    emails: [],
    whatsapp: null,
    redesSociales: [],
    urlPerfilAnfitrion: null,
    metodoPrincipal: null,
    notas: [],
    rawMatches: [],
  };

  const { fullText, allLinks } = domData;

  // ── From links ──
  for (const link of allLinks) {
    const href = link.href || "";

    if (href.startsWith("tel:")) {
      const phone = href.replace("tel:", "").trim();
      contact.telefonos.push(phone);
      contact.rawMatches.push({ tipo: "telefono", valor: phone, fuente: "link-tel" });
    }

    if (href.startsWith("mailto:")) {
      const email = href.replace("mailto:", "").trim();
      contact.emails.push(email);
      contact.rawMatches.push({ tipo: "email", valor: email, fuente: "link-mailto" });
    }

    if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
      const m = href.match(/(?:wa\.me\/|phone=)(\d+)/);
      if (m) {
        contact.whatsapp = m[1];
        contact.telefonos.push(m[1]);
        contact.rawMatches.push({ tipo: "whatsapp", valor: m[1], fuente: "link-whatsapp" });
      }
    }

    if (href.includes("instagram.com/") && !href.includes("estei.app")) {
      contact.redesSociales.push({ plataforma: "instagram", url: href });
    }
    if (href.includes("facebook.com/") && !href.includes("estei.app")) {
      contact.redesSociales.push({ plataforma: "facebook", url: href });
    }
    if (
      (href.includes("twitter.com/") || href.includes("x.com/")) &&
      !href.includes("EsteiApp")
    ) {
      contact.redesSociales.push({ plataforma: "twitter/x", url: href });
    }
  }

  // ── Phone regex from text ──
  const phonePatterns = [
    { pat: /\+58\s*4\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, src: "text-ve-mobile" },
    { pat: /04\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, src: "text-ve-local" },
    { pat: /\+58\s*2\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, src: "text-ve-landline" },
    { pat: /\+58\s*\d{10}/g, src: "text-ve-generic" },
    { pat: /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, src: "text-generic-10" },
  ];

  for (const { pat, src } of phonePatterns) {
    const matches = fullText.matchAll(pat);
    for (const m of matches) {
      const phone = m[0].replace(/[\s-.]/g, "");
      if (phone.length >= 10 && /^\+?\d+$/.test(phone)) {
        if (!contact.telefonos.includes(phone)) {
          contact.telefonos.push(phone);
          contact.rawMatches.push({ tipo: "telefono", valor: phone, fuente: src });
        }
      }
    }
  }

  // ── Email regex from text ──
  const emailPat = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = fullText.match(emailPat) || [];
  for (const e of emailMatches) {
    const skip = [
      "estei.app",
      "google",
      "zoho",
      "clarity",
      "facebook",
      "analytics",
    ];
    if (!skip.some((s) => e.includes(s)) && !contact.emails.includes(e)) {
      contact.emails.push(e);
      contact.rawMatches.push({ tipo: "email", valor: e, fuente: "text-regex" });
    }
  }

  // ── From API responses ──
  for (const resp of captured) {
    const bodyStr = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body);

    // Phones in JSON
    const jsonPhonePats = [
      /(?:"|')(?:phone|telefono|celular|mobile|whatsapp|tel)(?:"|')\s*:\s*(?:"|')(\+?\d[\d\s\-]{8,})(?:"|')/gi,
      /(?:"|')(?:phone|telefono|celular|mobile|whatsapp|tel)(?:"|')\s*:\s*(\+?\d[\d\s\-]{8,})/gi,
    ];
    for (const pat of jsonPhonePats) {
      const matches = bodyStr.matchAll(pat);
      for (const m of matches) {
        const phone = m[1].replace(/[\s\-]/g, "");
        if (phone.length >= 10 && /^\+?\d+$/.test(phone) && !contact.telefonos.includes(phone)) {
          contact.telefonos.push(phone);
          contact.rawMatches.push({ tipo: "telefono", valor: phone, fuente: `api:${resp.url.slice(0, 80)}` });
        }
      }
    }

    // Emails in JSON
    const apiEmails = bodyStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const e of apiEmails) {
      const skip = ["estei.app", "google", "zoho", "clarity", "facebook", "analytics", "gravatar"];
      if (!skip.some((s) => e.includes(s)) && !contact.emails.includes(e)) {
        contact.emails.push(e);
        contact.rawMatches.push({ tipo: "email", valor: e, fuente: `api:${resp.url.slice(0, 80)}` });
      }
    }

    // WhatsApp in JSON
    const waMatch = bodyStr.match(/(?:whatsapp|wa\.me)[:\s"']*(\+?\d{10,})/i);
    if (waMatch && !contact.whatsapp) {
      contact.whatsapp = waMatch[1];
      contact.rawMatches.push({ tipo: "whatsapp", valor: waMatch[1], fuente: `api:${resp.url.slice(0, 80)}` });
    }

    // Host name
    const nameMatch = bodyStr.match(/(?:"|')(?:host_name|anfitrion|owner_name|host)(?:"|')\s*:\s*(?:"|')([^"']{2,50})(?:"|')/i);
    if (nameMatch) {
      contact.rawMatches.push({ tipo: "host_name", valor: nameMatch[1], fuente: `api:${resp.url.slice(0, 80)}` });
    }
  }

  // ── Deduplicate & finalize ──
  contact.telefonos = [...new Set(contact.telefonos)];
  contact.emails = [...new Set(contact.emails)];
  contact.redesSociales = contact.redesSociales.filter(
    (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i
  );

  if (contact.whatsapp) {
    contact.metodoPrincipal = `WhatsApp: ${contact.whatsapp}`;
    contact.notas.push("WhatsApp disponible - contacto directo");
  } else if (contact.telefonos.length > 0) {
    contact.metodoPrincipal = `Telefono: ${contact.telefonos[0]}`;
    contact.notas.push("Telefono encontrado - verificar si es WhatsApp");
  }

  if (contact.telefonos.length === 0 && contact.emails.length === 0 && contact.redesSociales.length === 0) {
    contact.notas.push("No se encontro contacto directo - puede requerir login/mensajeria interna");
  }

  return contact;
}

// ═══════════════════════════════════════════════════
// IMAGE DOWNLOAD
// ═══════════════════════════════════════════════════

async function downloadImages(
  imageUrls: { src: string; alt: string }[],
  outputDir: string
): Promise<ScrapedImage[]> {
  const imagesDir = path.join(outputDir, "images");
  ensureDir(imagesDir);

  const filtered = imageUrls.filter((img) => isPropertyImage(img.src));
  const results: ScrapedImage[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const img = filtered[i];
    const ext = getImageExt(img.src);
    const safeName = slugify(img.alt || `foto-${i + 1}`);
    const filename = `${String(i + 1).padStart(2, "0")}_${safeName}.${ext}`;
    const localPath = path.join(imagesDir, filename);
    const downloadUrl = cleanImageUrl(img.src);

    try {
      await downloadWithRetry(downloadUrl, localPath);
      results.push({
        url: img.src,
        alt: img.alt,
        orden: i + 1,
        esPrincipal: i === 0,
        archivoLocal: filename,
      });
      console.log(`    \u2713 ${filename}`);
    } catch (err: any) {
      console.log(`    \u2717 ${filename}: ${err.message}`);
      results.push({
        url: img.src,
        alt: img.alt,
        orden: i + 1,
        esPrincipal: i === 0,
        archivoLocal: "",
      });
    }

    await sleep(400);
  }

  return results;
}

// ═══════════════════════════════════════════════════
// PROPERTY DISCOVERY
// ═══════════════════════════════════════════════════

async function discoverProperties(ctx: BrowserContext): Promise<string[]> {
  const found = new Set<string>();

  for (const loc of CONFIG.searchLocations) {
    console.log(`  Buscando en: ${loc}`);
    const page = await ctx.newPage();
    const captured = setupNetworkCapture(page);

    try {
      const searchUrl = `${CONFIG.baseUrl}/search?location=${encodeURIComponent(loc)}&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: CONFIG.timeout });

      await page
        .waitForFunction(
          () => !document.querySelector('[data-testid="three-dots-loading"]')?.isConnected,
          { timeout: CONFIG.timeout }
        )
        .catch(() => {});

      await sleep(CONFIG.delays.pageLoad);

      // Wait for content
      await page
        .waitForSelector('a[href*="/stay/"]', { timeout: 10000 })
        .catch(() => {});

      // Scroll to trigger lazy loading
      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(CONFIG.delays.afterScroll);
      }

      // Extract property links from DOM
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/stay/"]'))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((h) => h.includes("/profile"))
      );

      for (const link of links) found.add(link);

      // Extract property IDs from captured API responses
      for (const resp of captured) {
        const bodyStr = JSON.stringify(resp.body);
        const idMatches = bodyStr.matchAll(/(?:slug|"id"|"stay_id")[\s:]+["']?(\d{15,})/g);
        for (const m of idMatches) {
          found.add(`${CONFIG.baseUrl}/stay/${m[1]}/profile?guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`);
        }
      }

      console.log(`    ${links.length} links + API IDs encontrados`);
    } catch (err: any) {
      console.log(`    Error: ${err.message.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  return Array.from(found);
}

// ═══════════════════════════════════════════════════
// SCRAPE SINGLE PROPERTY
// ═══════════════════════════════════════════════════

async function scrapeProperty(
  ctx: BrowserContext,
  url: string
): Promise<{ data: PropertyData; contact: ContactData } | null> {
  const propertyId = extractPropertyId(url);
  console.log(`\n  Scraping: ${propertyId}`);

  const page = await ctx.newPage();
  const captured = setupNetworkCapture(page);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: CONFIG.timeout });

    // Wait for loading spinner to disappear (content loaded)
    await page
      .waitForFunction(
        () => {
          const spinner = document.querySelector('[data-testid="three-dots-loading"]');
          return !spinner?.isConnected;
        },
        { timeout: CONFIG.timeout }
      )
      .catch(() => {});

    // Extra wait for dynamic content to render
    await sleep(8000);

    // Try clicking contact buttons to reveal phone numbers
    const contactBtns = [
      'button:has-text("Contactar")',
      'button:has-text("Telefono")',
      'button:has-text("Ver telefono")',
      'button:has-text("Mostrar numero")',
      'a:has-text("Contactar")',
      'button:has-text("Llamar")',
      'button:has-text("Show phone")',
      'button:has-text("Contact")',
      '[class*="contact"]',
      '[class*="phone"]',
    ];

    for (const sel of contactBtns) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 500 })) {
          await el.click().catch(() => {});
          await sleep(1500);
        }
      } catch {}
    }

    // Extract from DOM
    const domData = await extractFromDOM(page);

    // Parse host info from API responses
    const hostInfo: HostInfo = {
      nombre: null,
      imagen: null,
      miembroDesde: null,
      telefono: null,
      email: null,
      whatsapp: null,
    };

    let latitud: number | null = domData.latitud;
    let longitud: number | null = domData.longitud;

    for (const resp of captured) {
      if (typeof resp.body !== "object" || !resp.body) continue;
      const body = resp.body as Record<string, any>;

      const tryExtract = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        hostInfo.nombre = hostInfo.nombre || obj.name || obj.nombre || obj.full_name || null;
        hostInfo.telefono = hostInfo.telefono || obj.phone || obj.telefono || obj.mobile || obj.phone_number || null;
        hostInfo.email = hostInfo.email || obj.email || null;
        hostInfo.imagen = hostInfo.imagen || obj.avatar || obj.image || obj.photo || obj.profile_image || null;
        hostInfo.whatsapp = hostInfo.whatsapp || obj.whatsapp || obj.whatsapp_number || null;
        hostInfo.miembroDesde = hostInfo.miembroDesde || obj.created_at || obj.member_since || obj.joined || null;
      };

      tryExtract(body.host || body.user || body.anfitrion || body.owner || body.profile);
      if (body.data) {
        tryExtract(body.data.host || body.data.user || body.data.owner);
        if (body.data.latitude && !latitud) {
          latitud = parseFloat(body.data.latitude);
          longitud = parseFloat(body.data.longitude);
        }
      }
      if (Array.isArray(body)) {
        for (const item of body) {
          if (typeof item === "object" && item !== null) {
            tryExtract(item.host || item.user || item);
            if (item.latitude && !latitud) {
              latitud = parseFloat(item.latitude);
              longitud = parseFloat(item.longitude);
            }
          }
        }
      }
    }

    // Host name from DOM
    if (!hostInfo.nombre && domData.anfitrionSection) {
      const nm =
        domData.anfitrionSection.match(/Anfitri[o\u00f3]n[:\s]+([^\n,]{2,40})/i) ||
        domData.anfitrionSection.match(/Hosteado por[:\s]+([^\n,]{2,40})/i) ||
        domData.anfitrionSection.match(/Host[:\s]+([^\n,]{2,40})/i);
      if (nm) hostInfo.nombre = nm[1].trim();
    }

    // Build property data
    const slug = slugify(domData.titulo || `propiedad-${propertyId}`);
    const data: PropertyData = {
      id: propertyId,
      slug,
      url,
      scrapedAt: new Date().toISOString(),
      titulo: domData.titulo || "Sin titulo",
      descripcion: domData.descripcion,
      tipoPropiedad: domData.tipoPropiedad || "APARTAMENTO",
      precioPorNoche: domData.precioPorNoche,
      precioOriginal: domData.precioOriginal,
      moneda: "USD",
      capacidadMaxima: domData.capacidadMaxima,
      habitaciones: domData.habitaciones,
      banos: domData.banos,
      camas: domData.camas,
      direccion: domData.direccion,
      ciudad: domData.ciudad,
      estado: domData.estado,
      zona: domData.zona,
      latitud,
      longitud,
      reglas: domData.reglas,
      politicaCancelacion: "MODERADA",
      horarioCheckIn: domData.horarioCheckIn,
      horarioCheckOut: domData.horarioCheckOut,
      estanciaMinima: 1,
      estanciaMaxima: 30,
      amenidades: domData.amenidades,
      anfitrion: hostInfo,
      imagenes: [],
    };

    // ── Parse GraphQL getStay response (primary data source) ──
    let gqlStay: any = null;
    for (const resp of captured) {
      if (resp.url.includes("graphql") && typeof resp.body === "object") {
        const body = resp.body as Record<string, any>;
        if (body?.data?.getStay) {
          gqlStay = body.data.getStay;
          break;
        }
      }
    }

    const propDir = path.join(CONFIG.outputDir, `${slug}_${propertyId}`);
    ensureDir(propDir);

    if (captured.length > 0) {
      saveJSON(
        path.join(propDir, "_raw_network.json"),
        captured.map((c) => ({ url: c.url, status: c.status, body: c.body }))
      );
    }

    // Override DOM data with GraphQL data (more accurate)
    if (gqlStay) {
      const lang = (obj: any) => obj?.es || obj?.en || obj?.pt || "";

      if (lang(gqlStay.title)) data.titulo = lang(gqlStay.title).trim();
      if (lang(gqlStay.description)) data.descripcion = lang(gqlStay.description).trim();
      if (gqlStay.price) data.precioPorNoche = gqlStay.price;
      if (gqlStay.capacity) data.capacidadMaxima = gqlStay.capacity;
      if (gqlStay.type) data.tipoPropiedad = lang(gqlStay.type.name) || data.tipoPropiedad;

      if (gqlStay.checkIn) {
        const ci = gqlStay.checkIn.minTime;
        if (ci) data.horarioCheckIn = `${ci.hour}:${String(ci.minute).padStart(2, "0")}`;
      }
      if (gqlStay.checkOut) {
        const co = gqlStay.checkOut.maxTime;
        if (co) data.horarioCheckOut = `${co.hour}:${String(co.minute).padStart(2, "0")}`;
      }

      // Host from GQL
      if (gqlStay.host) {
        const h = gqlStay.host;
        data.anfitrion.nombre = `${h.firstName || ""} ${h.lastName || ""}`.trim() || data.anfitrion.nombre;
        data.anfitrion.imagen = h.photo || data.anfitrion.imagen;
        if (h.host) {
          data.anfitrion.miembroDesde = h.host.since || h.createdAt || data.anfitrion.miembroDesde;
        }
        // Store host slug for contact URL
        if (h.slug) {
          (domData as any).hostSlug = h.slug;
        }
        // Check for phone/email directly on host object
        if (h.phone && !data.anfitrion.telefono) data.anfitrion.telefono = h.phone;
        if (h.email && !data.anfitrion.email) data.anfitrion.email = h.email;
        if (h.whatsapp && !data.anfitrion.whatsapp) data.anfitrion.whatsapp = h.whatsapp;
      }

      // Rules, location, amenities from GQL
      if (gqlStay.rules) data.reglas = lang(gqlStay.rules);

      // Address: GraphQL returns a full Address object
      if (gqlStay.address) {
        const addr = gqlStay.address;
        if (typeof addr === "object" && addr !== null) {
          data.direccion = addr.formattedAddress ? lang(addr.formattedAddress) : "";
          data.ciudad = addr.locality || data.ciudad;
          data.estado = addr.administrativeAreaLevel1 || data.estado;
          data.zona = addr.neighborhood || addr.subLocality || null;
          if (addr.description) {
            data.direccion += (data.direccion ? " - " : "") + lang(addr.description);
          }
          // Coordinates from address
          if (addr.coordinates?.coordinates) {
            data.latitud = addr.coordinates.coordinates[1];
            data.longitud = addr.coordinates.coordinates[0];
          }
        } else {
          data.direccion = String(addr);
        }
      }
      if (gqlStay.location?.coordinates) {
        data.latitud = gqlStay.location.coordinates[1];
        data.longitud = gqlStay.location.coordinates[0];
      }
      if (gqlStay.refundPolicy) {
        data.politicaCancelacion = lang(gqlStay.refundPolicy.title) || data.politicaCancelacion;
      }

      // Rooms from GQL
      if (gqlStay.bedrooms) data.habitaciones = gqlStay.bedrooms;
      if (gqlStay.bathrooms) data.banos = gqlStay.bathrooms;
      if (gqlStay.beds) data.camas = gqlStay.beds;

      // Amenities from GQL
      if (Array.isArray(gqlStay.amenities) && gqlStay.amenities.length > 0) {
        data.amenidades = gqlStay.amenities.map((a: any) => lang(a.name || a) || "").filter(Boolean);
      }

      // Extract ALL images from GQL (not just DOM)
      if (Array.isArray(gqlStay.images) && gqlStay.images.length > 0) {
        const gqlImages = gqlStay.images.map((img: any, i: number) => ({
          src: typeof img === "string" ? img : img.url || img.src || "",
          alt: typeof img === "string" ? "" : img.alt || img.caption || "",
        })).filter((i: any) => i.src && isPropertyImage(i.src));

        // Merge with DOM images (deduplicate by URL base)
        const existingUrls = new Set(gqlImages.map((i: any) => i.src.split("?")[0]));
        for (const di of domData.imageUrls) {
          if (!existingUrls.has(di.src.split("?")[0]) && isPropertyImage(di.src)) {
            gqlImages.push(di);
          }
        }
        domData.imageUrls = gqlImages;
      }
    }

    // Re-run contact extraction with full GraphQL data
    const contact = extractContacts(domData, captured);

    // Add host profile URL if slug found
    const hostSlug = (domData as any).hostSlug;
    if (hostSlug) {
      contact.urlPerfilAnfitrion = `${CONFIG.baseUrl}/host/${hostSlug}`;
      contact.notas.push(`Perfil del anfitrion: ${CONFIG.baseUrl}/host/${hostSlug}`);
    }

    // Deep search ALL GQL responses for phone/email patterns
    for (const resp of captured) {
      if (!resp.url.includes("graphql")) continue;
      const fullBody = JSON.stringify(resp.body);
      // Search for any phone-like patterns in the full response
      const deepPhones = fullBody.match(/(?:"|')(?:phone|telefono|mobile|celular|whatsapp)(?:"|')?\s*[:=]\s*(?:"|')?(\+?\d[\d\s\-]{7,}\d)(?:"|')?/gi) || [];
      for (const m of deepPhones) {
        const numMatch = m.match(/(\+?\d[\d\s\-]{7,}\d)/);
        if (numMatch) {
          const num = numMatch[1].replace(/[\s\-]/g, "");
          if (num.length >= 10 && /^\+?\d+$/.test(num) && !contact.telefonos.includes(num)) {
            contact.telefonos.push(num);
            contact.rawMatches.push({ tipo: "telefono", valor: num, fuente: "gql-deep-search" });
          }
        }
      }
      const deepEmails = fullBody.match(/(?:"|')?email(?:"|')?\s*[:=]\s*(?:"|')?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:"|')?/gi) || [];
      for (const e of deepEmails) {
        const em = e.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (em) {
          const skip = ["estei.app", "google", "zoho", "clarity", "facebook"];
          if (!skip.some((s) => em[1].includes(s)) && !contact.emails.includes(em[1])) {
            contact.emails.push(em[1]);
            contact.rawMatches.push({ tipo: "email", valor: em[1], fuente: "gql-deep-search" });
          }
        }
      }
    }

    // Set primary method
    if (contact.telefonos.length > 0 && !contact.metodoPrincipal) {
      contact.metodoPrincipal = `Telefono: ${contact.telefonos[0]}`;
    }
    if (contact.telefonos.length === 0 && contact.emails.length === 0 && contact.urlPerfilAnfitrion) {
      contact.metodoPrincipal = `Perfil: ${contact.urlPerfilAnfitrion}`;
    }
    if (contact.telefonos.length === 0 && contact.emails.length === 0 && contact.redesSociales.length === 0 && !contact.urlPerfilAnfitrion) {
      contact.notas.push("No se encontro contacto directo - puede requerir login/mensajeria interna");
    }

    // Merge contact into host
    if (contact.telefonos.length > 0 && !data.anfitrion.telefono)
      data.anfitrion.telefono = contact.telefonos[0];
    if (contact.whatsapp && !data.anfitrion.whatsapp)
      data.anfitrion.whatsapp = contact.whatsapp;
    if (contact.emails.length > 0 && !data.anfitrion.email)
      data.anfitrion.email = contact.emails[0];

    // Re-slug with correct title
    if (gqlStay) {
      data.slug = slugify(data.titulo);
    }
    const finalDir = path.join(CONFIG.outputDir, `${data.slug}_${propertyId}`);
    if (finalDir !== propDir) {
      try { fs.renameSync(propDir, finalDir); } catch {}
    }

    // Download images
    const downloadable = domData.imageUrls.filter((i) => isPropertyImage(i.src));
    console.log(`    Imagenes: ${domData.imageUrls.length} encontradas, ${downloadable.length} descargables`);
    const images = await downloadImages(domData.imageUrls, finalDir);
    data.imagenes = images;

    // Save data files
    saveJSON(path.join(finalDir, "data.json"), data);
    saveJSON(path.join(finalDir, "contact.json"), contact);

    console.log(`    Titulo: ${data.titulo}`);
    console.log(`    Precio: $${data.precioPorNoche || "?"} USD/noche`);
    console.log(`    Anfitrion: ${data.anfitrion.nombre || "desconocido"}`);
    console.log(`    Imagenes descargadas: ${images.filter((i) => i.archivoLocal).length}`);
    console.log(`    Telefonos: ${contact.telefonos.length > 0 ? contact.telefonos.join(", ") : "ninguno"}`);
    console.log(`    Emails: ${contact.emails.length > 0 ? contact.emails.join(", ") : "ninguno"}`);
    console.log(`    Guardado en: ${finalDir}`);

    return { data, contact };
  } catch (err: any) {
    console.error(`    Error: ${err.message.slice(0, 100)}`);
    return null;
  } finally {
    await page.close();
  }
}

// ═══════════════════════════════════════════════════
// LOAD KNOWN URLs
// ═══════════════════════════════════════════════════

function loadKnownUrls(): string[] {
  const urls: string[] = [];
  const infoDir = path.join(__dirname, "..", "infoScrapeada");

  const combinedFile = path.join(infoDir, "inmuebles_estei.json");
  if (fs.existsSync(combinedFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(combinedFile, "utf-8"));
      for (const prop of existing) {
        const url = prop.fuenteScraping?.urlOriginal;
        if (url && url.includes("/stay/")) {
          const id = extractPropertyId(url);
          const fullUrl = url.includes("guests")
            ? url
            : `${url}${url.includes("?") ? "&" : "?"}guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;
          urls.push(fullUrl);
        }
      }
    } catch {}
  }

  const scrapedFiles = [
    path.join(infoDir, "inmuebles_scraped.json"),
    path.join(infoDir, "inmuebles_seed.json"),
  ];
  for (const fp of scrapedFiles) {
    if (fs.existsSync(fp)) {
      try {
        const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        const items = Array.isArray(data) ? data : [data];
        for (const prop of items) {
          const url = prop.fuenteScraping?.urlOriginal;
          if (url && url.includes("/stay/")) {
            const fullUrl = url.includes("guests")
              ? url
              : `${url}${url.includes("?") ? "&" : "?"}guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;
            urls.push(fullUrl);
          }
        }
      } catch {}
    }
  }

  // Individual files
  if (fs.existsSync(infoDir)) {
    const files = fs.readdirSync(infoDir).filter((f) => f.startsWith("inmueble_scrapeado_") && f.endsWith(".json"));
    for (const f of files) {
      try {
        const prop = JSON.parse(fs.readFileSync(path.join(infoDir, f), "utf-8"));
        const url = prop.fuenteScraping?.urlOriginal;
        if (url && url.includes("/stay/")) {
          const fullUrl = url.includes("guests")
            ? url
            : `${url}${url.includes("?") ? "&" : "?"}guests=1&arrival_date=2026-04-14&departure_date=2026-04-15`;
          urls.push(fullUrl);
        }
      } catch {}
    }
  }

  return urls;
}

// ═══════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════

interface CliOptions {
  mode: "single" | "discover" | "all";
  url?: string;
  headless: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = { mode: "all", headless: true };

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--url=")) {
      opts.mode = "single";
      opts.url = args[i].replace("--url=", "");
    } else if (args[i] === "--url" && args[i + 1]) {
      opts.mode = "single";
      opts.url = args[++i];
    } else if (args[i] === "--discover") {
      opts.mode = "discover";
    } else if (args[i] === "--all") {
      opts.mode = "all";
    } else if (args[i] === "--headed") {
      opts.headless = false;
    } else if (["--help", "-h"].includes(args[i])) {
      console.log(`
Estei.app Property Scraper
==========================

Usage:
  npx tsx scraper.ts [options]

Options:
  --url=<URL>      Scrape una propiedad
  --discover       Solo descubrir URLs nuevas
  --all            Descubrir + scrapear todo (default)
  --headed         Mostrar navegador (debug)
  -h, --help       Esta ayuda

Ejemplos:
  npx tsx scraper.ts --url=https://estei.app/stay/123/profile
  npx tsx scraper.ts --discover
  npx tsx scraper.ts --all --headed
`);
      process.exit(0);
    }
  }

  return opts;
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("Estei.app Property Scraper");
  console.log("=".repeat(50));

  const opts = parseArgs();
  CONFIG.headless = opts.headless;
  ensureDir(CONFIG.outputDir);

  const index: IndexEntry[] = loadJSON(CONFIG.indexFile, []);
  const errors: { url: string; error: string; date: string }[] = loadJSON(CONFIG.errorFile, []);
  const scrapedIds = new Set(index.map((p) => p.id));

  console.log("\nIniciando navegador...");
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const ctx = await browser.newContext({
    userAgent: CONFIG.userAgent,
    viewport: { width: 1920, height: 1080 },
    locale: "es-VE",
    extraHTTPHeaders: {
      "Accept-Language": "es-VE,es;q=0.9,en;q=0.8",
    },
  });

  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  try {
    let urlsToScrape: string[] = [];

    if (opts.mode === "single" && opts.url) {
      urlsToScrape = [opts.url];
    } else {
      // Discover
      if (opts.mode === "discover" || opts.mode === "all") {
        console.log("\nDescubriendo propiedades...");
        const discovered = await discoverProperties(ctx);
        console.log(`  Total descubiertas: ${discovered.length}`);
        urlsToScrape.push(...discovered);

        if (opts.mode === "discover") {
          saveJSON(path.join(__dirname, "discovered.json"), discovered);
          console.log("\nURLs guardadas en discovered.json");
          await browser.close();
          return;
        }
      }

      // Load known URLs
      const known = loadKnownUrls();
      console.log(`  URLs conocidas (infoScrapeada): ${known.length}`);
      urlsToScrape.push(...known);
    }

    // Deduplicate by property ID
    const seen = new Map<string, string>();
    for (const u of urlsToScrape) {
      const id = extractPropertyId(u);
      if (!seen.has(id)) seen.set(id, u);
    }
    urlsToScrape = Array.from(seen.values());

    // Filter already scraped
    const newUrls = urlsToScrape.filter((u) => !scrapedIds.has(extractPropertyId(u)));

    console.log(`\nPropiedades: ${newUrls.length} nuevas / ${urlsToScrape.length} total / ${scrapedIds.size} ya scrapeadas`);

    // Scrape
    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      console.log(`\n${"─".repeat(50)}`);
      console.log(`[${i + 1}/${newUrls.length}]`);

      const result = await scrapeProperty(ctx, url);

      if (result) {
        const propId = extractPropertyId(url);
        index.push({
          id: propId,
          slug: result.data.slug,
          titulo: result.data.titulo,
          url,
          carpeta: `${result.data.slug}_${propId}`,
          scrapedAt: result.data.scrapedAt,
        });
        saveJSON(CONFIG.indexFile, index);
      } else {
        errors.push({
          url,
          error: "Scraping failed",
          date: new Date().toISOString(),
        });
        saveJSON(CONFIG.errorFile, errors);
      }

      if (i < newUrls.length - 1) {
        const delay = CONFIG.delays.betweenRequests + Math.random() * 2000;
        console.log(`  Esperando ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
      }
    }
  } catch (err: any) {
    console.error(`\nError fatal: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("RESUMEN");
  console.log("=".repeat(50));
  console.log(`Propiedades scrapeadas: ${index.length}`);
  console.log(`Errores: ${errors.length}`);
  console.log(`Datos: ${CONFIG.outputDir}`);
  console.log(`Indice: ${CONFIG.indexFile}`);
}

main().catch(console.error);
