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

  // LocationFilterInput fields
  console.log("=== LocationFilterInput fields ===");
  const locTests = [
    `query { searchStays(data: {location: {lat: 10.49, lng: -66.88}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {latitude: 10.49, longitude: -66.88}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {name: "Caracas"}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {address: "Caracas"}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {city: "Caracas"}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {search: "Caracas"}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {query: "Caracas"}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {location: {text: "Caracas"}}) { items { _id slug title { es } } } }`,
  ];

  for (const query of locTests) {
    const r = await q(query);
    const s = JSON.stringify(r);
    const isInternal = s.includes("NO_SENTRY");
    const isInvalid = s.includes("GRAPHQL_VALIDATION_FAILED");
    if (isInternal) {
      console.log(`\n*** INTERNAL ERROR (fields might work): ${query.slice(28, 95)}`);
      console.log(s.slice(0, 200));
    } else if (isInvalid) {
      const suggestions = s.match(/Did you mean "([^"]+)"/g);
      const unknownFields = s.match(/Field "([^"]+)" is not defined/g);
      console.log(`\nINVALID: ${query.slice(28, 95)}`);
      if (unknownFields) console.log(`  Unknown: ${unknownFields.join(", ")}`);
      if (suggestions) console.log(`  Suggestions: ${suggestions.join(", ")}`);
    } else {
      console.log(`\n*** SUCCESS: ${query.slice(28, 95)}`);
      console.log(s.slice(0, 500));
    }
  }

  // Also search for valid fields by brute force
  console.log("\n=== SearchStaysInput field brute force ===");
  const fields = [
    "guests", "arrivalDate", "departureDate", "checkIn", "checkOut",
    "startDate", "endDate", "dateFrom", "dateTo",
    "minPrice", "maxPrice", "priceRange",
    "type", "propertyType", "category",
    "amenities", "attribute",
    "sortBy", "sort", "order",
    "page", "limit", "skip", "first", "after",
    "location", "viewport", "bounds", "bbox",
    "neLat", "neLng", "swLat", "swLng",
  ];

  for (const f of fields) {
    const val = f.toLowerCase().includes("date") || f === "checkIn" || f === "checkOut" ? '"2026-04-14"' :
                f.toLowerCase().includes("price") ? "100" :
                f === "guests" ? "1" :
                f.includes("Lat") || f.includes("Lng") ? "10.0" :
                f === "page" || f === "limit" || f === "skip" || f === "first" ? "10" :
                f === "sort" || f === "order" || f === "sortBy" ? '"price"' :
                f === "amenities" || f === "attribute" ? '["pool"]' :
                f === "location" ? '{lat: 10, lng: -66}' :
                f === "viewport" || f === "bounds" || f === "bbox" ? '{ne: {lat: 12, lng: -60}, sw: {lat: 0, lng: -74}}' :
                '"test"';
    const r = await q(`query { searchStays(data: {${f}: ${val}}) { items { _id } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("is not defined by type")) {
      console.log(`  ${f}: VALID - ${s.slice(0, 200)}`);
    }
  }

  await browser.close();
})().catch(console.error);
