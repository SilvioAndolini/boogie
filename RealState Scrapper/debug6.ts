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

  // Intercept GraphQL requests
  page.on("request", async (req) => {
    if (req.url().includes("graphql")) {
      console.log("\n=== GraphQL REQUEST ===");
      console.log("Method:", req.method());
      const postData = req.postData();
      if (postData) {
        try {
          const parsed = JSON.parse(postData);
          console.log("Operation:", parsed.operationName);
          console.log("Query:", parsed.query?.slice(0, 500));
          if (parsed.variables) console.log("Variables:", JSON.stringify(parsed.variables).slice(0, 500));
        } catch {
          console.log("Raw:", postData.slice(0, 500));
        }
      }
    }
  });

  page.on("response", async (resp) => {
    if (resp.url().includes("graphql")) {
      try {
        const body = await resp.json();
        console.log("\n=== GraphQL RESPONSE ===");
        console.log("Status:", resp.status());
        const str = JSON.stringify(body);
        console.log("Body:", str.slice(0, 1000));
      } catch {}
    }
  });

  // Load a known property page
  console.log("Loading property page...");
  await page.goto(
    "https://estei.app/stay/17281517903060393862/profile?guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "domcontentloaded", timeout: 45000 }
  );
  await page.waitForTimeout(15000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\n=== Page content (first 1000) ===");
  console.log(bodyText.slice(0, 1000));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
