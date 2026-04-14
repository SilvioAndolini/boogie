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
    return page.evaluate(async (queryStr) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr }),
      });
      return await res.json();
    }, query);
  };

  // 1. Find searchStays data fields
  console.log("=== Exploring searchStays data fields ===");
  const dataTests = [
    `query { searchStays(data: {location: "Venezuela"}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {query: ""}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {guests: 1, arrivalDate: "2026-04-14", departureDate: "2026-04-15"}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {latitude: 10.49, longitude: -66.88, radius: 500}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {northEast: {lat: 12, lng: -60}, southWest: {lat: 0, lng: -74}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {bounds: {ne: {lat: 12, lng: -60}, sw: {lat: 0, lng: -74}}}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {page: 1, limit: 20}) { items { _id slug title { es } } } }`,
    `query { searchStays(data: {offset: 0, limit: 20}) { items { _id slug title { es } } } }`,
  ];

  for (const query of dataTests) {
    const r = await q(query);
    const s = JSON.stringify(r);
    const isInternalErr = s.includes("NO_SENTRY");
    const isValidation = s.includes("GRAPHQL_VALIDATION_FAILED");
    console.log(`\n${isInternalErr ? "INTERNAL" : isValidation ? "INVALID" : "OK"}: ${query.slice(20, 90)}`);
    if (!isInternalErr) console.log(s.slice(0, 400));
    else console.log("  Internal error (fields might be right!)");
  }

  // 2. Explore PaginationInfo fields
  console.log("\n=== PaginationInfo fields ===");
  const pageTests = [
    `query { searchStays { items { _id } pageInfo { hasNextPage hasPreviousPage } } }`,
    `query { searchStays { items { _id } pageInfo { page limit offset } } }`,
  ];
  for (const query of pageTests) {
    const r = await q(query);
    console.log(JSON.stringify(r).slice(0, 500));
  }

  // 3. Check all available queries by trying common names
  console.log("\n=== Available query names ===");
  const queryNames = [
    "getHomeStays", "homeStays", "featuredStays", "recommendedStays",
    "allStays", "listStays", "staySearch", "staysByLocation",
    "staysByHost", "nearbyStays", "popularStays", "trendingStays",
    "getStates", "getCities", "getLocations", "locations",
    "getCategories", "categories",
  ];

  for (const name of queryNames) {
    const r = await q(`query { ${name} { _id } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  ${name}: ${s.slice(0, 300)}`);
    }
  }

  await browser.close();
})().catch(console.error);
