import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();
  await page.goto("https://casa.mercadolibre.com.ve/MLV-774303361-casa-de-estilo-espanol-en-alquiler-en-la-suiza-san-an", {
    waitUntil: "domcontentloaded", timeout: 30000
  });
  await new Promise(r => setTimeout(r, 5000));

  // Search for phone in ALL script tags and global objects
  const phoneData = await page.evaluate(() => {
    const win = window as any;
    const results: string[] = [];

    // Search global objects
    for (const key of Object.keys(win)) {
      try {
        const val = win[key];
        if (typeof val === "string" && (val.includes("584") || val.includes("phone"))) {
          results.push(`window.${key}: ${val.slice(0, 200)}`);
        }
        if (typeof val === "object" && val !== null) {
          const str = JSON.stringify(val);
          if (str && (str.includes("584") || str.includes("phone_number") || str.includes("whatsapp"))) {
            results.push(`window.${key}: ${str.slice(0, 300)}`);
          }
        }
      } catch {}
    }

    // Search hidden elements
    const hiddens = document.querySelectorAll('[style*="display: none"], [style*="display:none"], [hidden], input[type="hidden"]');
    for (const el of hiddens) {
      const val = (el as HTMLInputElement).value || el.textContent || "";
      if (val.match(/\d{10,}/)) {
        results.push(`hidden[${el.tagName}]: ${val.slice(0, 200)}`);
      }
    }

    // Search data attributes
    const allEls = document.querySelectorAll("[data-phone], [data-whatsapp], [data-contact], [data-seller]");
    for (const el of allEls) {
      const attrs = Array.from(el.attributes).map(a => `${a.name}=${a.value}`).join(", ");
      results.push(`data-attr: ${attrs}`);
    }

    return results;
  });

  console.log("Phone data found:", phoneData.length);
  phoneData.forEach(d => console.log(" ", d));

  // Try fetching the API with recaptcha bypass (simulate click flow)
  console.log("\n=== Try WhatsApp button click ===");
  const waBtn = await page.locator('button').filter({ hasText: /WhatsApp/i }).first();
  if (await waBtn.isVisible({ timeout: 2000 })) {
    // Listen for new pages/popups
    const popupPromise = ctx.waitForEvent("page", { timeout: 5000 }).catch(() => null);
    await waBtn.click();
    await new Promise(r => setTimeout(r, 3000));

    const popup = await popupPromise;
    if (popup) {
      console.log("Popup URL:", popup.url());
      await popup.close();
    }

    // Check for new URLs in the page
    const allLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a")).map(a => a.href).filter(h => h.includes("wa.me") || h.includes("whatsapp"))
    );
    console.log("WhatsApp links after click:", allLinks);
  }

  await browser.close();
})().catch(console.error);
