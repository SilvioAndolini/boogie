import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17281517903060393862/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 8000));
  try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); } } catch {}

  // Extract DOM structure info
  const info = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").filter(l => l.trim());

    // Find the title - it's usually after "Registrarse" or first large text
    let title = "";
    const allEls = document.querySelectorAll("h1, h2, h3, [class*='title'], [class*='name'], [class*='heading']");
    for (const el of allEls) {
      if ((el.textContent?.trim().length || 0) > 3 && (el.textContent?.trim().length || 0) < 100) {
        title = el.textContent?.trim() || "";
        break;
      }
    }

    // Get images
    const imgs = Array.from(document.querySelectorAll("img"))
      .filter((img) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
      .map((img) => ({ src: img.src, alt: img.alt }));

    // Get first 20 lines of text
    const firstLines = lines.slice(0, 30).join("\n");

    return { title, imgCount: imgs.length, firstImg: imgs[0]?.src?.slice(0, 80), firstLines };
  });

  console.log("Title found:", info.title);
  console.log("Images:", info.imgCount);
  console.log("First img:", info.firstImg);
  console.log("\nFirst lines:\n", info.firstLines);

  await browser.close();
})().catch(console.error);
