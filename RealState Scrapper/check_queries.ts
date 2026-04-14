import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const page = await ctx.newPage();
  await page.goto("https://estei.app/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 3000));

  const q = async (query: string) => {
    return page.evaluate(async (qs) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qs }),
      });
      return await res.json();
    }, query);
  };

  // Try queries that might list all stays
  const tests = [
    `query { getHomeStays { _id slug title { es } } }`,
    `query { homeStays { _id slug title { es } } }`,
    `query { featuredStays { _id slug title { es } } }`,
    `query { recommendedStays { _id slug title { es } } }`,
    `query { allStays { _id slug title { es } } }`,
    `query { listStays { _id slug title { es } } }`,
    `query { staysByLocation(location: "Venezuela") { _id slug title { es } } }`,
    `query { nearbyStays { _id slug title { es } } }`,
    `query { getStaysByState(state: "Venezuela") { _id slug title { es } } }`,
    `query { getCities { _id name { es } } }`,
    `query { getLocations { _id name { es } } }`,
    `query { locations { _id name { es } } }`,
    `query { getHomeStayAttributes { stayAttributes { slug name { es } } } }`,
  ];

  for (const query of tests) {
    const r = await q(query);
    const s = JSON.stringify(r);
    const name = query.match(/query \{ (\w+)/)?.[1];
    if (s.includes("Cannot query field")) {
      console.log(`  ${name}: NOT FOUND`);
    } else if (s.includes("NO_SENTRY")) {
      console.log(`  ${name}: INTERNAL ERROR (exists but broken)`);
    } else {
      console.log(`  ${name}: SUCCESS - ${s.slice(0, 500)}`);
    }
  }

  await browser.close();
})().catch(console.error);
