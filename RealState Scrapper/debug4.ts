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
  const allResponses: { url: string; status: number; body: string }[] = [];

  page.on("response", async (resp) => {
    const url = resp.url();
    if (
      url.includes("google") ||
      url.includes("fonts") ||
      url.includes("zoho") ||
      url.includes("doubleclick") ||
      url.includes("clarity") ||
      url.includes("googleads") ||
      url.includes("pagead") ||
      url.includes("gstatic") ||
      url.includes("googleapis.com/maps") ||
      url.includes("sentry") ||
      url.includes("facebook") ||
      url.endsWith(".js") ||
      url.endsWith(".css") ||
      url.endsWith(".woff")
    )
      return;

    try {
      const ct = resp.headers()["content-type"] || "";
      let body = "";
      try {
        const b = await resp.json();
        body = JSON.stringify(b);
      } catch {
        try {
          body = await resp.text();
        } catch {}
      }
      allResponses.push({ url, status: resp.status(), body: body.slice(0, 2000) });
    } catch {}
  });

  // Go directly to a known property page and capture API calls
  console.log("=== Loading known property page ===");
  await page.goto(
    "https://estei.app/stay/17273652068679158460/profile?guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "networkidle", timeout: 45000 }
  );
  await page.waitForTimeout(8000);

  console.log("\n=== ALL NON-GOOGLE RESPONSES ===");
  for (const r of allResponses) {
    console.log(`\n${r.status} ${r.url}`);
    if (r.body && r.body.length > 5) {
      console.log(`  Body: ${r.body.slice(0, 500)}`);
    }
  }

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
