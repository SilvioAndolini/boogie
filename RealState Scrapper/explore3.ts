import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0", viewport: { width: 1920, height: 1080 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17281517903060393862/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 5000));
  try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); } } catch {}

  const q = async (query: string) => {
    return page.evaluate(async (qs) => {
      const res = await fetch("https://api.estei.app/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: qs }) });
      return await res.json();
    }, query);
  };

  // Find image/media field
  const imgFields = ["images", "media", "gallery", "pictures", "imgs", "files", "cover", "coverPhoto", "coverImage", "thumbnail", "banner", "mediaFiles"];
  console.log("=== Image fields ===");
  for (const f of imgFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { ${f} { url } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) console.log(`  ${f}: VALID -> ${s.slice(0, 300)}`);
  }

  // Find location/geo fields
  const geoFields = ["location", "geo", "coordinates", "coords", "lat", "lng", "latLng", "point", "position", "mapLocation", "geoLocation", "place"];
  console.log("\n=== Geo fields ===");
  for (const f of geoFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { ${f} } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) console.log(`  ${f}: VALID -> ${s.slice(0, 300)}`);
  }

  // Find amenity field
  const amenFields = ["amenities", "features", "services", "comodidades", "tags", "labels", "categories", "attributes"];
  console.log("\n=== Amenity fields ===");
  for (const f of amenFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { ${f} { slug name { es } } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) console.log(`  ${f}: VALID -> ${s.slice(0, 300)}`);
  }

  // Host fields that need subfields
  console.log("\n=== Host nested fields ===");
  const r1 = await q(`query { getStay(record: {slug: "17281517903060393862"}) { host { phones { number active } photo { url } host { name email phone memberSince } role { name } } } }`);
  console.log("host.full:", JSON.stringify(r1).slice(0, 500));

  // checkIn/checkOut TimeRange fields
  console.log("\n=== TimeRange fields ===");
  const r2 = await q(`query { getStay(record: {slug: "17281517903060393862"}) { checkIn { start end } checkOut { start end } } }`);
  console.log("checkIn/checkOut:", JSON.stringify(r2).slice(0, 300));

  // Full working query
  console.log("\n=== Full working query ===");
  const fullQuery = `query { getStay(record: {slug: "17281517903060393862"}) {
    _id slug title { es } description { es } price capacity status
    address { route country neighborhood postalCode formattedAddress { es } }
    rooms { name { es } capacity }
    checkIn { start end } checkOut { start end }
    type { slug name { es } } space { slug name { es } }
    host { slug email firstName lastName photo { url } phones { number active } host { name email phone memberSince } }
  } }`;
  const rFull = await q(fullQuery);
  console.log(JSON.stringify(rFull).slice(0, 2000));

  await browser.close();
})().catch(console.error);
