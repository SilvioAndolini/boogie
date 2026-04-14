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

  // Brute force StaySearchOutput fields
  console.log("=== StaySearchOutput fields ===");
  const fields = [
    "_id", "id", "slug", "title", "type", "stats", "space",
    "description", "address", "location", "price", "rating",
    "reviews", "images", "photos", "thumbnail", "cover",
    "host", "amenities", "features", "attributes",
    "checkIn", "checkOut", "pricePerNight", "nightlyPrice",
    "bedrooms", "bathrooms", "beds", "guests",
    "url", "link", "path", "name",
  ];

  for (const f of fields) {
    const subquery = f === "title" || f === "description" || f === "name" ? `{ es }` : "";
    const r = await q(`query { searchStays(data: {location: {lat: 10.49, lng: -66.88, maxDistanceMeters: 2000000}, guests: 1, arrivalDate: "2026-04-14", departureDate: "2026-04-15"}) { items { ${f}${subquery} } } }`);
    const s = JSON.stringify(r);
    if (s.includes("SUCCESS") || s.includes("items") || !s.includes("Cannot query field")) {
      console.log(`  ${f}: VALID`);
      if (s.length < 500) console.log(`    ${s.slice(0, 300)}`);
    }
  }

  // Try with just the known valid fields
  console.log("\n=== Search with valid fields ===");
  const r = await q(`query {
    searchStays(data: {
      location: {lat: 10.49, lng: -66.88, maxDistanceMeters: 2000000},
      guests: 1,
      arrivalDate: "2026-04-14",
      departureDate: "2026-04-15"
    }) {
      items {
        _id slug title { es } type stats { count } space { bedrooms bathrooms beds maxGuests }
      }
      pageInfo { hasNextPage }
    }
  }`);
  console.log(JSON.stringify(r).slice(0, 5000));

  await browser.close();
})().catch(console.error);
