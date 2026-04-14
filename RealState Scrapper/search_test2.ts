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

  // Try various arg names for searchStays
  const argNames = ["input", "filter", "where", "data", "params", "search", "options", "args", "staySearchInput", "SearchInput"];
  for (const arg of argNames) {
    const query = `query { searchStays(${arg}: {}) { items { _id slug title { es } } } }`;
    const r = await q(query);
    const s = JSON.stringify(r);
    const hasUnknownArg = s.includes("Unknown argument");
    if (!hasUnknownArg) {
      console.log(`\n*** ${arg} WORKS! ***`);
      console.log(s.slice(0, 1000));
    } else {
      const suggested = s.match(/Did you mean "([^"]+)"/);
      console.log(`  ${arg}: UNKNOWN${suggested ? ` (suggested: ${suggested[1]})` : ""}`);
    }
  }

  // Try no args but different fields on SearchStaysType
  console.log("\n=== Exploring SearchStaysType fields ===");
  const fieldTests = [
    `query { searchStays { items { _id slug } } }`,
    `query { searchStays { items { _id slug title { es } } count } }`,
    `query { searchStays { items { _id } meta { total } } }`,
    `query { searchStays { items { _id } pageInfo { total } } }`,
  ];

  for (const query of fieldTests) {
    const r = await q(query);
    console.log(`\n${query.slice(0, 80)}`);
    console.log(JSON.stringify(r).slice(0, 500));
  }

  // Try the persisted query hashes from the site
  console.log("\n=== Using persisted query hash ===");
  const persistedTests = [
    {
      op: "StayAttributes",
      hash: "067f6492e171dd327ec0fe3ebf8a3f9be39d314e26c9eb1c55e3d09b2cb21307",
      vars: {},
    },
  ];

  for (const t of persistedTests) {
    const body = {
      operationName: t.op,
      variables: t.vars,
      extensions: { persistedQuery: { version: 1, sha256Hash: t.hash } },
    };
    const r = await page.evaluate(async (b) => {
      const res = await fetch("https://api.estei.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      return await res.json();
    }, body);
    console.log(`\n${t.op}: ${JSON.stringify(r).slice(0, 1000)}`);
  }

  // Also try the Stay query with different approaches to get random stays
  console.log("\n=== Getting multiple random stays ===");
  const randomTests = [
    `query { stay { _id slug title { es } } }`,
    `query { stay(useCase: "search") { _id slug title { es } } }`,
    `query { stay(random: true) { _id slug title { es } } }`,
    `query { stay(id: "random") { _id slug title { es } } }`,
  ];

  for (const query of randomTests) {
    const r = await q(query);
    const s = JSON.stringify(r);
    console.log(`\n${query.slice(0, 80)}`);
    console.log(s.slice(0, 300));
  }

  await browser.close();
})().catch(console.error);
