import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0",
    viewport: { width: 1920, height: 1080 },
  });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));

  const page = await ctx.newPage();
  await page.goto("https://estei.app/stay/17281517903060393862/profile", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r => setTimeout(r, 8000));
  try { const btn = page.locator('button:has-text("Aceptar")'); if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); await new Promise(r => setTimeout(r, 300)); } } catch {}

  // Get the HTML around the property name
  const html = await page.evaluate(() => {
    // Find text "Loft Playa el Ángel" in DOM
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.includes("Loft Playa")) {
        const parent = walker.currentNode.parentElement;
        return {
          text: walker.currentNode.textContent,
          tagName: parent?.tagName,
          className: parent?.className,
          parentHTML: parent?.outerHTML?.slice(0, 500),
          grandParentTag: parent?.parentElement?.tagName,
          grandParentClass: parent?.parentElement?.className,
        };
      }
    }
    return null;
  });

  console.log("Property name element:", JSON.stringify(html, null, 2));

  // Also get all image URLs
  const imgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => img.src.includes("imagekit") || img.src.includes("digitaloceanspaces"))
      .map((img) => ({ src: img.src, alt: img.alt, width: img.naturalWidth }))
  );
  console.log("\nImages:", imgs.length);
  imgs.slice(0, 5).forEach((img) => console.log(`  ${img.src.slice(0, 80)} | alt: ${img.alt} | ${img.width}w`));

  // Get full text for parsing
  const text = await page.evaluate(() => document.body.innerText);
  console.log("\nFull page text:\n", text.slice(0, 3000));

  await browser.close();
})().catch(console.error);
