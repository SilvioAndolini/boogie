import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function extractFromDOM(page: any) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

    const regIdx = lines.findIndex((l: string) => l === "Registrarse");
    const titulo = regIdx >= 0 ? lines[regIdx + 1] || "" : "";
    const location = regIdx >= 0 ? lines[regIdx + 2] || "" : "";

    // Description
    const descStart = lines.findIndex((l: string) => l === "Descripción");
    let description = "";
    if (descStart >= 0) {
      const headers = ["Atributos del alojamiento", "Capacidad", "Comodidades", "Información", "Anfitrión", "Disponibilidad", "Mapas", "Políticas", "Servicios Adicionales", "Conoce a tu anfitrión"];
      let end = lines.length;
      for (let i = descStart + 1; i < lines.length; i++) {
        if (headers.some(h => lines[i] === h)) { end = i; break; }
        if (lines[i] === "Mostrar más") { end = i; break; }
      }
      description = lines.slice(descStart + 1, end).join("\n");
    }

    // Price
    const priceMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)\s*\/?\s*noche/i) || text.match(/(\d+(?:[.,]\d+)?)\s*USD\s*\/?\s*noche/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

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

    // Amenities - only real ones
    const realAmenities = ["WiFi", "Aire acondicionado", "Estacionamiento", "Piscina", "Terraza", "Seguridad", "Tanque de agua", "Planta eléctrica", "Nevera", "TV", "Lavadora", "Secadora", "Cocina", "Vajilla", "Juego de ollas", "Horno", "Agua caliente", "Vasos", "Asador", "BBQ", "Jardín", "Piscina privada", "Jacuzzi", "Gimnasio", "Sauna", "Calefacción", "Chimenea", "Balcón", "Vista al mar", "Playa", "Mascotas permitidas", "Pet friendly", "Ciudad", "Montaña", "Smart TV", "Cable", "Netflix", "Cafetera", "Toallas", "Ropa de cama", "Secador de pelo", "Plancha", "Plancha para ropa", "Microondas", "Lavavajillas", "Puerto USB", "Escritorio", "Caja fuerte", "Armario"];
    const amenities: string[] = [];
    const attrStart = lines.findIndex((l: string) => l === "Atributos del alojamiento");
    if (attrStart >= 0) {
      const stops = ["Capacidad", "Descripción", "Información", "Abril", "Mayo", "Junio", "Selecciona tu", "Check-in:", "Check-out:", "Horarios", "Servicios Adicionales", "Conoce a tu anfitrión", "Políticas", "Disponibilidad", "Mapas", "Compartir"];
      for (let i = attrStart + 1; i < Math.min(attrStart + 30, lines.length); i++) {
        const line = lines[i];
        if (stops.some(m => line.startsWith(m) || line === m)) break;
        if (line.length < 2 || line.length > 40) continue;
        if (/^\d+$/.test(line)) continue;
        if (line.match(/^[A-Z]{2}$/)) continue;
        if (realAmenities.some(a => a.toLowerCase() === line.toLowerCase())) {
          amenities.push(line);
        }
      }
    }

    // Host
    let hostName: string | null = null;
    const hostMatch = text.match(/Conoce a tu anfitrión[\s\S]*?es anfitrión/);
    if (hostMatch) {
      const hostLines = hostMatch[0].split("\n").map((l: string) => l.trim()).filter(Boolean);
      const idx = hostLines.findIndex((l: string) => l === "Conoce a tu anfitrión");
      if (idx >= 0 && hostLines[idx + 1]) hostName = hostLines[idx + 1];
    }

    // Images
    const images = Array.from(document.querySelectorAll("img"))
      .filter((img: any) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
      .map((img: any) => ({ src: img.src, alt: img.alt || "" }));

    return { titulo, location, description, price, capacity, bedrooms, bathrooms, beds, amenities, hostName, images };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const slugs = ["17273652068679158460", "17671575175875487256", "17334605034372713645", "17282634530070259675", "17281517903060393862"];

  for (const slug of slugs) {
    const page = await ctx.newPage();
    await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
    try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await new Promise(r => setTimeout(r, 200)); } } catch {}
    await page.waitForFunction(() => { const sp = document.querySelector('[data-testid="three-dots-loading"]'); return !sp?.isConnected; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const t = document.body.innerText; const l = t.split("\n").filter((x: string) => x.trim()); const ri = l.findIndex((x: string) => x.includes("Registrarse")); return ri >= 0 && l.slice(ri+1, ri+10).some((x: string) => x.length > 10 && !x.includes("No se encontró")); }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const data = await extractFromDOM(page);
    console.log(`\n=== ${slug} ===`);
    console.log(`Título: ${data.titulo}`);
    console.log(`Precio: $${data.price || "?"}/noche`);
    console.log(`Ubicación: ${data.location}`);
    console.log(`Capacidad: ${data.capacity}`);
    console.log(`Hab: ${data.bedrooms} | Baños: ${data.bathrooms} | Camas: ${data.beds}`);
    console.log(`Amenidades (${data.amenities?.length || 0}): ${(data.amenities || []).join(", ")}`);
    console.log(`Anfitrión: ${data.hostName || "?"}`);
    console.log(`Descripción: ${(data.descripcion || "").slice(0, 150)}...`);
    console.log(`Imágenes: ${data.imagenes.length}`);
    await page.close();
  }
  await browser.close();
})().catch(console.error);
