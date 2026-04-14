import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();
  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const q = async (query: string, vars: any = {}) => {
    return page.evaluate(async ({ qs, v }) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qs, variables: v }),
      });
      return await res.json();
    }, { qs: query, v: vars });
  };

  // First, find the correct input type
  console.log("=== FindStayInput fields ===");
  const r1 = await q(`query { getStay(record: {slug: "17281517903060393862"}) { _id slug title { es } } }`);
  console.log("getStay (wrong type):", JSON.stringify(r1).slice(0, 300));

  // Try FindStayInput
  const r2 = await q(`query { getStay(record: {slug: "17281517903060393862"}, record: {slug: "17281517903060393862"}) { _id slug title { es } } }`);
  console.log("getStay (duplicate record):", JSON.stringify(r2).slice(0, 300));

  // Try with FindStayInput
  const r3 = await q(`query GetStay($record: FindStayInput!) { getStay(record: $record) { _id slug title { es } description { es } address { street city state country } latitude longitude pricePerNight maxGuests bedrooms bathrooms beds checkInTime checkOutTime propertyType amenities { name } host { name email phone memberSince } images { url alt } } }`,
    { record: { slug: "17281517903060393862" } });
  console.log("\nFindStayInput:", JSON.stringify(r3).slice(0, 3000));

  // Try another property
  const r4 = await q(`query GetStay($record: FindStayInput!) { getStay(record: $record) { _id slug title { es } address { street city state country } latitude longitude pricePerNight maxGuests bedrooms bathrooms beds images { url alt } } }`,
    { record: { slug: "17664338998486412566" } });
  console.log("\nAnother property:", JSON.stringify(r4).slice(0, 2000));

  await browser.close();
})().catch(console.error);
