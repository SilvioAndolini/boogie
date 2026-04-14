import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();

  // Intercept the contact-info API response
  let contactApiBody: string | null = null;
  page.on("response", async (resp) => {
    if (resp.url().includes("contact-info") || resp.url().includes("show-phones")) {
      try { contactApiBody = await resp.text(); } catch {}
    }
  });

  await page.goto("https://casa.mercadolibre.com.ve/MLV-774303361-casa-de-estilo-espanol-en-alquiler-en-la-suiza-san-an", {
    waitUntil: "domcontentloaded", timeout: 30000
  });
  await new Promise(r => setTimeout(r, 5000));

  // Search for phone in all script tags
  const scriptData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    const results: string[] = [];
    for (const script of scripts) {
      const content = script.textContent || "";
      if (content.includes("phone") || content.includes("whatsapp") || content.includes("celular") || content.includes("telefono") || content.includes("PHONE") || content.includes("584")) {
        results.push(content.slice(0, 1000));
      }
    }
    return results;
  });

  console.log("Scripts with phone/whatsapp references:", scriptData.length);
  scriptData.forEach((s, i) => console.log(`\n--- Script ${i} ---\n${s.slice(0, 500)}`));

  // Check __NEXT_DATA__ or similar
  const nextData = await page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    if (el) return el.textContent?.slice(0, 2000);

    // Check for __PRELOADED_STATE__ or similar
    const win = window as any;
    if (win.__PRELOADED_STATE__) return JSON.stringify(win.__PRELOADED_STATE__).slice(0, 2000);
    if (win.__INITIAL_STATE__) return JSON.stringify(win.__INITIAL_STATE__).slice(0, 2000);

    return null;
  });
  console.log("\nState data:", nextData?.slice(0, 500));

  // Try the API without recaptcha
  console.log("\n=== API without recaptcha ===");
  const apiTest = await page.evaluate(async () => {
    try {
      const res = await fetch("/p/api/items/MLV774303361/contact-info/show-phones?vertical=real_estate");
      return await res.text();
    } catch (e: any) { return e.message; }
  });
  console.log("API response:", apiTest?.slice(0, 500));

  // API response from intercepted call
  if (contactApiBody) {
    console.log("\nIntercepted API response:", contactApiBody.slice(0, 500));
  }

  await browser.close();
})().catch(console.error);
