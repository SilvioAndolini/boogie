import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0", viewport: { width: 1920, height: 1080 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();
  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const q = async (query: string) => {
    return page.evaluate(async (qs) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qs }),
      });
      return await res.json();
    }, query);
  };

  // Explore Stay type field by field
  const fields = [
    "description", "address", "rooms", "price", "capacity",
    "checkIn", "checkOut", "photos", "host", "type", "space",
    "location", "amenities", "features", "policy", "rules",
    "rating", "reviews", "status", "isAvailable", "isActive",
    "slug", "title",
  ];

  for (const f of fields) {
    const sub = f === "title" || f === "description" ? "{ es }" :
                f === "address" ? "{ route }" :
                f === "host" ? "{ slug title { es } email phones photo }" :
                f === "type" || f === "space" ? "{ slug name { es } }" :
                f === "photos" ? "{ url alt }" :
                f === "rooms" ? "{ name { es } capacity }" :
                f === "price" ? "{ amount currency }" :
                f === "capacity" ? "" :
                f === "checkIn" || f === "checkOut" ? "" :
                f === "location" ? "{ latitude longitude }" :
                f === "amenities" ? "{ name { es } }" :
                f === "features" ? "{ name { es } }" :
                f === "policy" ? "" :
                f === "rules" ? "" :
                f === "rating" ? "" :
                f === "reviews" ? "{ rating comment }" :
                f === "status" || f === "isAvailable" || f === "isActive" ? "" :
                f === "slug" || f === "title" ? "" :
                "";

    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { _id ${f}${sub ? " " + sub : ""} } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  ${f}: VALID${s.length < 300 ? " -> " + s.slice(0, 250) : ""}`);
    }
  }

  // Also explore Address type
  console.log("\n=== Address fields ===");
  const addrFields = ["route", "address", "street", "number", "neighborhood", "postalCode", "formattedAddress", "fullAddress", "city", "state", "country", "place"];
  for (const f of addrFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { address { ${f} } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  address.${f}: VALID${s.length < 300 ? " -> " + s.slice(0, 250) : ""}`);
    }
  }

  // Explore User/Host type
  console.log("\n=== Host fields ===");
  const userFields = ["slug", "email", "phones", "photo", "host", "role", "firstName", "lastName", "fullName", "username", "nickname"];
  for (const f of userFields) {
    const r = await q(`query { getStay(record: {slug: "17281517903060393862"}) { host { ${f} } } }`);
    const s = JSON.stringify(r);
    if (!s.includes("Cannot query field")) {
      console.log(`  host.${f}: VALID${s.length < 300 ? " -> " + s.slice(0, 250) : ""}`);
    }
  }

  await browser.close();
})().catch(console.error);
