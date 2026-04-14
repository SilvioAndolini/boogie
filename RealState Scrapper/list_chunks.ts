import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const scripts: string[] = [];
  page.on("response", (resp) => {
    const url = resp.url();
    if (url.includes("chunks/") && url.endsWith(".js")) {
      const match = url.match(/chunks\/([^/]+\.js)/);
      if (match) scripts.push(match[1]);
    }
  });
  await page.goto("https://estei.app/search?location=Caracas", { waitUntil: "networkidle", timeout: 30000 });
  console.log("Chunks loaded on search page:");
  scripts.forEach((s) => console.log("  " + s));
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
