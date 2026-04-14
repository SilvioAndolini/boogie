import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();
  const apiCalls: { url: string; status: number; body: string | null }[] = [];

  page.on("response", async (resp) => {
    const url = resp.url();
    if (
      url.includes("api") ||
      url.includes("supabase") ||
      url.includes("rest") ||
      url.includes("graphql") ||
      url.includes("rpc") ||
      url.includes("stay")
    ) {
      let body: string | null = null;
      try {
        const b = await resp.json();
        body = JSON.stringify(b).slice(0, 1000);
      } catch {}
      apiCalls.push({ url, status: resp.status(), body });
    }
  });

  await page.goto(
    "https://estei.app/search?location=Caracas&guests=1&arrival_date=2026-04-14&departure_date=2026-04-15",
    { waitUntil: "networkidle", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
  }

  console.log("API CALLS FOUND:", apiCalls.length);
  for (const c of apiCalls) {
    console.log("---");
    console.log("URL:", c.url);
    console.log("Status:", c.status);
    console.log("Body:", c.body);
  }

  const html = await page.content();
  const stayMatch = html.match(/href="[^"]*stay[^"]*"/g);
  console.log("---");
  console.log("Stay links found:", stayMatch ? stayMatch.length : 0);
  if (stayMatch) stayMatch.slice(0, 10).forEach((l) => console.log(l));

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
