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

    const amenStart = lines.findIndex((l: string) => l === "Atributos del alojamiento");
    const amenEnd = lines.findIndex((l: string, i: number) => i > amenStart && l === "Horarios");
    const amenities = amenStart >= 0 && amenEnd >= 0
      ? lines.slice(amenStart + 1, amenEnd).filter((l: string) => l.length >= 2 && l.length <= 40)
      : [];

    const checkInIdx = lines.findIndex((l: string) => l === "Check-in:");
    const checkIn = checkInIdx >= 0 ? lines[checkInIdx + 1] || null : null;
    const checkOutIdx = lines.findIndex((l: string) => l === "Check-out:");
    const checkOut = checkOutIdx >= 0 ? lines[checkOutIdx + 1] || null : null;

    const hostIdx = lines.findIndex((l: string) => l === "Conoce a tu anfitrión");
    const hostName = hostIdx >= 0 ? lines[hostIdx + 1] || null : null;

    const priceMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)\s*\/?\s*noche/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;
    const capMatch = text.match(/(\d+)\s*viajero/i);
    const capacity = capMatch ? parseInt(capMatch[1]) : null;
    const habMatch = text.match(/(\d+)\s*(?:habitaci[oó]n|recámara)/i);
    const bedrooms = habMatch ? parseInt(habMatch[1]) : null;
    const banoMatch = text.match(/(\d+)\s*ba[ñn]o/i);
    const bathrooms = banoMatch ? parseInt(banoMatch[1]) : null;

    const images = Array.from(document.querySelectorAll("img"))
      .filter((img: any) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
      .map((img: any) => ({ src: img.src, alt: img.alt || "" }));

    return { titulo, location, description, price, capacity, bedrooms, bathrooms, amenities, hostName, images, checkIn, checkOut };
  });
}

async function testProperty(ctx: any, slug: string) {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://estei.app/stay/${slug}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForFunction(() => !document.querySelector('[data-testid="three-dots-loading"]')?.isConnected, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => {
      const t = document.body.innerText; const l = t.split("\n").filter((x: string) => x.trim());
      const ri = l.findIndex((x: string) => x.includes("Registrarse"));
      return ri >= 0 && l.slice(ri + 1, ri + 10).some((x: string) => x.length > 10 && !x.includes("No se encontró"));
    }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes("No se encontró el alojamiento")) { console.log(`[${slug}] NOT FOUND`); return null; }

    const data = await extractFromDOM(page);
    console.log(`\n=== ${slug} ===`);
    console.log(JSON.stringify(data, null, 2));
    return data;
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  await testProperty(ctx, "17273652068679158460"); // Novo Hotel
  await testProperty(ctx, "17334605034372713645"); // Habitación #1

  await browser.close();
})().catch(console.error);
