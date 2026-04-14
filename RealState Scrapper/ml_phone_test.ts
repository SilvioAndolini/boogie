import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();
  await page.goto("https://apartamento.mercadolibre.com.ve/MLV-960169040-mls-26-9104-apartamento-en-alquiler-los-palos-grandes-yelixa-a-_JM", {
    waitUntil: "domcontentloaded", timeout: 30000
  });
  await new Promise(r => setTimeout(r, 5000));

  // Try clicking "Ver teléfono"
  const phoneLink = page.locator('a:has-text("Ver teléfono")').first();
  if (await phoneLink.isVisible({ timeout: 3000 })) {
    console.log("Found 'Ver teléfono' button, clicking...");
    await phoneLink.click();
    await new Promise(r => setTimeout(r, 3000));

    // Check for phone number after click
    const phoneAfter = await page.evaluate(() => {
      const text = document.body.innerText;
      const phones = text.match(/\b\d{4}[-\s]?\d{3}[-\s]?\d{4}\b/g) || [];
      const phones2 = text.match(/\b0\d{3}[-\s]?\d{7}\b/g) || [];
      const phones3 = text.match(/\b\+58\d{10}\b/g) || [];
      const allPhones = [...new Set([...phones, ...phones2, ...phones3])];

      // Check for modal/overlay
      const modals = document.querySelectorAll('[class*="modal"], [role="dialog"], [class*="overlay"], [class*="popup"]');
      const modalTexts = Array.from(modals).map(m => m.textContent?.trim().slice(0, 300));

      return { allPhones, modalTexts };
    });
    console.log("Phones after click:", phoneAfter.allPhones);
    console.log("Modals:", phoneAfter.modalTexts);
  }

  // Check for agency indicator
  const agencyCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const isAgency = text.includes("Corredora") || text.includes("corredora") || text.includes("Inmobiliaria") || text.includes("inmobiliaria");
    const sellerInfo = text.match(/Informaci[oó]n de la?\s*(corredora|vendedor|particular)[\s\S]{0,200}/i)?.[0] || "";
    return { isAgency, sellerInfo };
  });
  console.log("\nAgency check:", agencyCheck);

  await browser.close();
})().catch(console.error);
