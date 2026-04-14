import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();

  const query = `query GetStay($record: GetStayInput!) {
    getStay(record: $record) {
      _id slug title { es } description { es }
      address city state country latitude longitude
      pricePerNight maxGuests bedrooms bathrooms beds
      images { url alt }
    }
  }`;

  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  // Test with a known property
  const slugs = [
    "17281517903060393862", // Loft Playa el Angel (known)
    "17664338998486412566", // From search results
    "17721693857311894135", // From search results
  ];

  for (const slug of slugs) {
    console.log(`\nTesting slug: ${slug}`);
    const r = await page.evaluate(
      async ({ q, v }) => {
        try {
          const res = await fetch("https://api.estei.app/graphql", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName: "GetStay", query: q, variables: v }),
          });
          return await res.json();
        } catch (e: any) { return { error: e.message }; }
      },
      { q: query, v: { record: { slug, useCase: "bookingPreview" } } }
    );
    console.log(JSON.stringify(r).slice(0, 500));
  }

  // Also try without useCase
  console.log("\n\nTest without useCase:");
  const r2 = await page.evaluate(
    async ({ q, v }) => {
      try {
        const res = await fetch("https://api.estei.app/graphql", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName: "GetStay", query: q, variables: v }),
        });
        return await res.json();
      } catch (e: any) { return { error: e.message }; }
    },
    { q: query, v: { record: { slug: "17664338998486412566" } } }
  );
  console.log(JSON.stringify(r2).slice(0, 500));

  // Try from the actual property page
  console.log("\n\nTest from property page:");
  await page.goto("https://estei.app/stay/17281517903060393862/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 8000));
  
  // Capture all GraphQL responses
  const pageText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log("Page text:", pageText);

  await browser.close();
})().catch(console.error);
