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

  // Capture ALL network requests
  const requests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (
      !url.includes("google") &&
      !url.includes("fonts") &&
      !url.includes("zoho") &&
      !url.includes("clarity") &&
      !url.includes("sentry") &&
      !url.endsWith(".js") &&
      !url.endsWith(".css") &&
      !url.endsWith(".woff") &&
      !url.endsWith(".ico") &&
      !url.includes("doubleclick") &&
      !url.includes("pagead") &&
      !url.includes("googleads") &&
      !url.includes("gstatic")
    ) {
      requests.push(`${req.method()} ${url}`);
    }
  });

  page.on("response", async (resp) => {
    const url = resp.url();
    if (url.includes("graphql") || url.includes("supabase") || url.includes("/api/") || url.includes("rest/v1")) {
      let body = "";
      try {
        body = JSON.stringify(await resp.json());
      } catch {}
      console.log(`\n*** API RESPONSE: ${resp.status()} ${url}`);
      console.log(`  Body: ${body.slice(0, 500)}`);
    }
  });

  // Load property page
  await page.goto(
    "https://estei.app/stay/17273652068679158460/profile?guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "domcontentloaded", timeout: 45000 }
  );

  // Wait for content
  await page.waitForTimeout(10000);

  // Check page content
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("\n=== PROPERTY PAGE TEXT (first 3000) ===");
  console.log(bodyText.slice(0, 3000));

  // Check __NEXT_DATA__
  const nextData = await page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    return el ? el.textContent?.slice(0, 500) : "NOT FOUND";
  });
  console.log("\n=== __NEXT_DATA__ ===");
  console.log(nextData);

  // All requests
  console.log("\n=== ALL NON-GOOGLE REQUESTS ===");
  requests.forEach((r) => console.log("  " + r));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
