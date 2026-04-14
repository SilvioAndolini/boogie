import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();
  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  const q = async (query: string) => {
    return page.evaluate(async (qs) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qs }),
      });
      return await res.json();
    }, query);
  };

  // LocationFilterInput has lat, lng, maxDistanceMeters
  // Search all Venezuela with huge radius
  const query = `query {
    searchStays(data: {
      location: {lat: 10.49, lng: -66.88, maxDistanceMeters: 2000000},
      guests: 1,
      arrivalDate: "2026-04-14",
      departureDate: "2026-04-15"
    }) {
      items {
        _id
        slug
        title { es }
        city
        state
        pricePerNight
        maxGuests
        propertyType
        images { url alt }
      }
      pageInfo { hasNextPage }
    }
  }`;

  console.log("=== Full searchStays query ===");
  const r = await q(query);
  console.log(JSON.stringify(r).slice(0, 5000));

  // If no results, try without location
  console.log("\n=== Without location ===");
  const r2 = await q(`query {
    searchStays(data: {guests: 1, arrivalDate: "2026-04-14", departureDate: "2026-04-15"}) {
      items { _id slug title { es } city state }
      pageInfo { hasNextPage }
    }
  }`);
  console.log(JSON.stringify(r2).slice(0, 3000));

  // Try with just location
  console.log("\n=== Just location Venezuela ===");
  const r3 = await q(`query {
    searchStays(data: {location: {lat: 8.0, lng: -66.0, maxDistanceMeters: 5000000}}) {
      items { _id slug title { es } city state pricePerNight }
      pageInfo { hasNextPage }
    }
  }`);
  console.log(JSON.stringify(r3).slice(0, 5000));

  await browser.close();
})().catch(console.error);
