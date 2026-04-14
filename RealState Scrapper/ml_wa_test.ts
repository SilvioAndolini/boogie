import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();

  // Intercept network requests to find phone/API calls
  const apiCalls: string[] = [];
  page.on("response", async (resp) => {
    const url = resp.url();
    if (url.includes("phone") || url.includes("contact") || url.includes("seller") || url.includes("api")) {
      try { const body = await resp.text(); apiCalls.push(`${resp.status()} ${url.slice(0, 120)} | ${body.slice(0, 200)}`); } catch {}
    }
  });

  await page.goto("https://apartamento.mercadolibre.com.ve/MLV-774303361-casa-de-estilo-espanol-en-alquiler-en-la-suiza-san-an", {
    waitUntil: "domcontentloaded", timeout: 30000
  });
  await new Promise(r => setTimeout(r, 5000));

  // Find WhatsApp button/link with its href
  const waInfo = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a'));
    const waLinks = allLinks.filter(a => a.href?.includes('whatsapp') || a.href?.includes('wa.me'));
    const waBtns = Array.from(document.querySelectorAll('button, a')).filter(el =>
      el.textContent?.toLowerCase().includes('whatsapp')
    );

    return {
      waLinks: waLinks.map(a => ({ href: a.href, text: a.textContent?.trim() })),
      waBtns: waBtns.map(el => ({ href: (el as HTMLAnchorElement).href || "", text: el.textContent?.trim()?.slice(0, 50), tag: el.tagName })),
    };
  });

  console.log("WhatsApp links:", waInfo.waLinks);
  console.log("WhatsApp buttons:", waInfo.waBtns);

  // Click "Ver teléfono" and watch for modals
  const phoneBtn = await page.locator('text=Ver teléfono').first();
  if (await phoneBtn.isVisible({ timeout: 2000 })) {
    await phoneBtn.click();
    await new Promise(r => setTimeout(r, 3000));

    // Check for new modals/dialogs
    const afterClick = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"]');
      const dialogTexts = Array.from(dialogs).map(d => d.textContent?.trim().slice(0, 500));

      // Look for phone numbers anywhere
      const allText = document.body.innerText;
      const phones = allText.match(/\b0\d{3}[-\s]?\d{7}\b/g) || [];
      const phones2 = allText.match(/\b\d{4}[-\s]?\d{3}[-\s]?\d{4}\b/g) || [];

      // Check if page navigated
      return { dialogTexts, phones: [...phones, ...phones2], url: window.location.href };
    });
    console.log("\nAfter click - Dialogs:", afterClick.dialogTexts);
    console.log("Phones:", afterClick.phones);
  }

  // Check for "Particular" filter in search
  console.log("\n=== API calls ===");
  apiCalls.forEach(c => console.log(" ", c.slice(0, 200)));

  await browser.close();
})().catch(console.error);
