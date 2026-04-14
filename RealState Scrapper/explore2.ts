import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  // Use a property page as context (known to work)
  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17281517903060393862/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 5000));

  // Accept cookies
  try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); } } catch {}

  const q = async (query: string) => {
    try {
      const result = await page.evaluate(async (qs) => {
        try {
          const res = await fetch("https://api.estei.app/graphql", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: qs }),
          });
          return await res.json();
        } catch (e: any) { return { error: e.message }; }
      }, query);
      return result;
    } catch (e: any) {
      return { error: e.message };
    }
  };

  // Test basic query first
  console.log("=== Basic test ===");
  const r0 = await q(`query { getStay(record: {slug: "17281517903060393862"}) { _id slug title { es } } }`);
  console.log(JSON.stringify(r0).slice(0, 300));

  // Explore Stay fields
  console.log("\n=== Stay fields ===");
  const fields = [
    "description { es }", "address { route }", "rooms { name { es } capacity }",
    "price { amount currency }", "capacity", "checkIn", "checkOut",
    "photos { url alt }", "host { slug email phones photo }",
    "type { slug name { es } }", "space { slug name { es } }",
    "location { latitude longitude }", "amenities { slug name { es } }",
    "rating", "status", "isAvailable", "isActive",
    "policy { name { es } }", "rules", "reviews",
  ];

  for (const f of fields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { _id ${f} } }`);
    const s = JSON.stringify(r);
    if (s.includes("Cannot query field")) {
      console.log(`  ${f}: INVALID`);
    } else {
      console.log(`  ${f}: VALID -> ${s.slice(0, 300)}`);
    }
  }

  // Explore Address fields
  console.log("\n=== Address fields ===");
  const addrFields = ["route", "formattedAddress", "fullAddress", "street", "city", "state", "country", "place", "neighborhood", "postalCode"];
  for (const f of addrFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { address { ${f} } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  address.${f}: VALID -> ${s.slice(0, 200)}`);
    }
  }

  // Explore Host fields
  console.log("\n=== Host fields ===");
  const hostFields = ["slug", "email", "phones", "photo", "host", "role", "firstName", "lastName", "fullName"];
  for (const f of hostFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { host { ${f} } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  host.${f}: VALID -> ${s.slice(0, 200)}`);
    }
  }

  await browser.close();
})().catch(console.error);
