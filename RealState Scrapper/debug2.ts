import { chromium } from "playwright";

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
  const allResponses: { url: string; status: number; body: any }[] = [];

  page.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if (
      ct.includes("json") ||
      url.includes("/api/") ||
      url.includes("supabase") ||
      url.includes("rest/") ||
      url.includes("graphql") ||
      url.includes("rpc") ||
      url.includes("gql")
    ) {
      try {
        const body = await resp.json();
        allResponses.push({ url, status: resp.status(), body });
      } catch {}
    }
  });

  await page.goto(
    "https://estei.app/search?location=Caracas&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "networkidle", timeout: 45000 }
  );
  await page.waitForTimeout(8000);

  // Try scrolling
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  // Check page HTML for clues
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT (first 2000):", bodyText.slice(0, 2000));
  console.log("---");

  // Try interacting with search
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input")).map((i) => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      value: i.value,
    }));
  });
  console.log("INPUTS:", JSON.stringify(inputs, null, 2));
  console.log("---");

  // Check all JSON API responses
  console.log("JSON RESPONSES:", allResponses.length);
  for (const r of allResponses) {
    console.log(`  ${r.status} ${r.url.slice(0, 120)}`);
    if (r.body) {
      const str = JSON.stringify(r.body);
      if (str.length > 10 && !r.url.includes("google") && !r.url.includes("fonts"))
        console.log(`    Body: ${str.slice(0, 300)}`);
    }
  }

  // Try listing page
  console.log("\n=== TRYING LISTING PAGE ===");
  const page2 = await ctx.newPage();
  page2.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if (ct.includes("json") || url.includes("/api/") || url.includes("supabase") || url.includes("graphql")) {
      try {
        const body = await resp.json();
        allResponses.push({ url, status: resp.status(), body });
      } catch {}
    }
  });

  await page2.goto("https://estei.app/listing", { waitUntil: "networkidle", timeout: 30000 });
  await page2.waitForTimeout(5000);

  const bodyText2 = await page2.evaluate(() => document.body.innerText);
  console.log("LISTING PAGE TEXT (first 2000):", bodyText2.slice(0, 2000));

  // Try home page
  console.log("\n=== TRYING HOME PAGE ===");
  const page3 = await ctx.newPage();
  page3.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if (ct.includes("json") || url.includes("/api/") || url.includes("supabase") || url.includes("graphql")) {
      try {
        const body = await resp.json();
        allResponses.push({ url, status: resp.status(), body });
      } catch {}
    }
  });

  await page3.goto("https://estei.app/", { waitUntil: "networkidle", timeout: 30000 });
  await page3.waitForTimeout(5000);

  const stayLinks = await page3.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/stay/"]')).map((a) => (a as HTMLAnchorElement).href)
  );
  console.log("HOME - Stay links:", stayLinks.length);
  stayLinks.slice(0, 20).forEach((l) => console.log("  ", l));

  const bodyText3 = await page3.evaluate(() => document.body.innerText);
  console.log("HOME TEXT (first 3000):", bodyText3.slice(0, 3000));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
