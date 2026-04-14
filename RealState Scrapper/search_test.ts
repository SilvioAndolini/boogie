import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await ctx.newPage();
  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  const query = async (opName: string, query: string, vars: any = {}) => {
    return page.evaluate(
      async ({ op, q, v }) => {
        const res = await fetch("https://api.estei.app/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName: op, query: q, variables: v }),
        });
        return await res.json();
      },
      { op: opName, q: query, v: vars }
    );
  };

  // searchStays needs no external args (it errored with "internal error" not "unknown field")
  // Try to find what arguments it takes
  const tests = [
    { name: "searchStays empty record", q: `query { searchStays(record: {}) { items { _id slug title { es } } } }` },
    { name: "searchStays no args items", q: `query { searchStays { items { _id slug title { es } } } }` },
    { name: "searchStays with pagination", q: `query { searchStays(record: {}) { items { _id slug title { es } } total page pages } }` },
    { name: "searchStays with location", q: `query { searchStays(record: {location: "Venezuela"}) { items { _id slug title { es } } } }` },
    { name: "searchStays with geo", q: `query { searchStays(record: {latitude: 10.49, longitude: -66.88}) { items { _id slug title { es } } } }` },
    { name: "searchStays with city", q: `query { searchStays(record: {city: "Caracas"}) { items { _id slug title { es } } } }` },
    { name: "searchStays with state", q: `query { searchStays(record: {state: "Vargas"}) { items { _id slug title { es } } } }` },
    { name: "searchStays with country", q: `query { searchStays(record: {country: "Venezuela"}) { items { _id slug title { es } } } }` },
    { name: "searchStays with guests", q: `query { searchStays(record: {guests: 1}) { items { _id slug title { es } } } }` },
    { name: "searchStays with dates", q: `query { searchStays(record: {arrivalDate: "2026-04-14", departureDate: "2026-04-15"}) { items { _id slug title { es } } } }` },
    { name: "searchStays limit/offset", q: `query { searchStays(record: {limit: 50, offset: 0}) { items { _id slug title { es } } } }` },
    { name: "searchStays page/limit", q: `query { searchStays(record: {page: 1, limit: 50}) { items { _id slug title { es } } total } }` },
  ];

  for (const t of tests) {
    console.log(`\n=== ${t.name} ===`);
    try {
      const r = await query(t.name, t.q);
      const s = JSON.stringify(r);
      console.log(s.slice(0, 800));
    } catch (e: any) {
      console.log("Error:", e.message?.slice(0, 100));
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  await browser.close();
})().catch(console.error);
