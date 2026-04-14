import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17273652068679158460/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="three-dots-loading"]')?.isConnected, { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // Test extraction inline
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

    const regIdx = lines.findIndex((l: string) => l === "Registrarse");
    const titulo = regIdx >= 0 ? lines[regIdx + 1] || "" : "";

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

    // Amenities - simple approach: lines between "Atributos del alojamiento" and "Horarios"
    const amenStart = lines.findIndex((l: string) => l === "Atributos del alojamiento");
    const amenEnd = lines.findIndex((l: string, i: number) => i > amenStart && l === "Horarios");
    const amenities = amenStart >= 0 && amenEnd >= 0
      ? lines.slice(amenStart + 1, amenEnd).filter((l: string) => l.length >= 2 && l.length <= 40)
      : [];

    // Check-in/out: find "Check-in:" then next line has the time
    const checkInIdx = lines.findIndex((l: string) => l === "Check-in:");
    const checkIn = checkInIdx >= 0 ? lines[checkInIdx + 1] || null : null;
    const checkOutIdx = lines.findIndex((l: string) => l === "Check-out:");
    const checkOut = checkOutIdx >= 0 ? lines[checkOutIdx + 1] || null : null;

    // Host: find "Conoce a tu anfitrión" then next meaningful line is the name
    const hostIdx = lines.findIndex((l: string) => l === "Conoce a tu anfitrión");
    const hostName = hostIdx >= 0 ? lines[hostIdx + 1] || null : null;

    // Price
    const priceMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)\s*\/?\s*noche/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

    // Capacity
    const capMatch = text.match(/(\d+)\s*viajero/i);
    const capacity = capMatch ? parseInt(capMatch[1]) : null;

    // Rooms
    const habMatch = text.match(/(\d+)\s*(?:habitaci[oó]n|recámara)/i);
    const bedrooms = habMatch ? parseInt(habMatch[1]) : null;
    const banoMatch = text.match(/(\d+)\s*ba[ñn]o/i);
    const bathrooms = banoMatch ? parseInt(banoMatch[1]) : null;

    return { titulo, description, amenities, checkIn, checkOut, hostName, price, capacity, bedrooms, bathrooms };
  });

  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})().catch(console.error);
