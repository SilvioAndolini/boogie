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

  const text = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT (first 5000):\n");
  console.log(text.slice(0, 5000));

  console.log("\n\n=== CONTACT SECTION ===");
  // Look for phone/contact elements
  const contactInfo = await page.evaluate(() => {
    const allText = document.body.innerText;
    const phonePattern = /\b\d{4}[-\s]?\d{3}[-\s]?\d{4}\b/g;
    const phones = allText.match(phonePattern) || [];

    // Look for specific contact sections
    const sellerSection = document.querySelector('[class*="seller"], [class*="contact"], [class*="phone"], [data-testid*="contact"]');
    const sellerText = sellerSection?.textContent?.trim() || "";

    // Look for "Ver teléfono" or similar buttons
    const phoneButtons = Array.from(document.querySelectorAll('button, a'))
      .filter(el => el.textContent?.toLowerCase().includes("teléfono") || el.textContent?.toLowerCase().includes("telefono") || el.textContent?.toLowerCase().includes("whatsapp") || el.textContent?.toLowerCase().includes("contactar"))
      .map(el => ({ text: el.textContent?.trim(), tag: el.tagName }));

    return { phones, sellerText: sellerText.slice(0, 500), phoneButtons };
  });

  console.log("Phones found:", contactInfo.phones);
  console.log("Seller section:", contactInfo.sellerText);
  console.log("Phone buttons:", contactInfo.phoneButtons);

  // Look for attributes/specs
  console.log("\n=== ATTRIBUTES ===");
  const attrs = await page.evaluate(() => {
    const attrElements = document.querySelectorAll('[class*="attribute"], [class*="spec"], tr, dl dt, dl dd');
    return Array.from(attrElements).slice(0, 30).map(el => el.textContent?.trim()).filter(Boolean);
  });
  console.log("Attributes:", attrs.slice(0, 20));

  // Check for JSON-LD structured data
  console.log("\n=== JSON-LD ===");
  const jsonLd = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => s.textContent?.slice(0, 500));
  });
  jsonLd.forEach(j => console.log(j));

  await browser.close();
})().catch(console.error);
