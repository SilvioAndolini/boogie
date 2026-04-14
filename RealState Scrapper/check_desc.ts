import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17273652068679158460/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 8000));

  // Get all lines around "Descripción"
  const info = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const descIdx = lines.findIndex((l: string) => l.includes("Descripción"));
    return {
      descIdx,
      aroundDesc: descIdx >= 0 ? lines.slice(descIdx, descIdx + 15) : [],
      allLines: lines.slice(0, 50),
    };
  });

  console.log("Around Descripción:", JSON.stringify(info.aroundDesc));
  console.log("\nFirst 50 lines:", JSON.stringify(info.allLines));

  await browser.close();
})().catch(console.error);
