import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const testUrls = [
    "https://apartamento.mercadolibre.com.ve/MLV-774330823-apartamento-av-lecuna-caracas-distrito-capital",
    "https://apartamento.mercadolibre.com.ve/MLV-962811806-apartamento-en-alquiler-urb-el-marques-_JM",
    "https://casa.mercadolibre.com.ve/MLV-774303361-casa-de-estilo-espanol-en-alquiler-en-la-suiza-san-an",
  ];

  for (const url of testUrls) {
    console.log(`\n=== ${url.match(/MLV-\d+/)?.[0]} ===`);
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await new Promise(r => setTimeout(r, 4000));

      const data = await page.evaluate(() => {
        const text = document.body.innerText;

        // Agency detection
        const isAgency = text.includes("Corredora") || text.includes("Inmobiliaria") || text.includes("inmobiliaria") || text.includes("Agencia");
        const isVerified = text.includes("identidad verificada");
        const sellerSection = text.match(/Informaci[oó]n de la?\s*(corredora|vendedor|particular)[\s\S]{0,300}/i)?.[0] || "";

        // Phone extraction
        const phoneMatch = text.match(/\b0\d{3}[-\s]?\d{7}\b/g) || [];
        const phoneMatch2 = text.match(/\b\d{4}[-\s]?\d{3}[-\s]?\d{4}\b/g) || [];
        const whatsappBtn = document.querySelector('a[href*="whatsapp"]') || 
          Array.from(document.querySelectorAll('button, a')).find(el => el.textContent?.toLowerCase().includes('whatsapp'));
        const whatsappHref = (whatsappBtn as HTMLAnchorElement)?.href || "";

        // Title
        const h1 = document.querySelector("h1");
        const title = h1?.textContent?.trim() || "";

        // Price
        const priceMatch = text.match(/US\$\s*([\d.,]+)/);
        const price = priceMatch ? priceMatch[1] : "";

        // Location
        const locMatch = text.match(/Ubicación\s*\n([\s\S]{0,200})/);
        const location = locMatch ? locMatch[1].trim().split("\n")[0] : "";

        // Description
        const descMatch = text.match(/Descripción\s*\n([\s\S]*?)(?:\nInformación de la zona|\nPublicación #|$)/);
        const description = descMatch ? descMatch[1].trim().slice(0, 500) : "";

        // Features
        const superficie = text.match(/Superficie total\s*\n(\d+ m²)/)?.[1] || "";
        const habitaciones = text.match(/Habitaciones\s*\n(\d+)/)?.[1] || "";
        const banos = text.match(/Baños\s*\n(\d+)/)?.[1] || "";
        const antiguedad = text.match(/Antigüedad\s*\n([\w\s]+)/)?.[1] || "";

        // "Ver teléfono" button
        const phoneBtn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent?.toLowerCase().includes('ver teléfono'));

        return {
          title, price, location, description, superficie, habitaciones, banos, antiguedad,
          isAgency, isVerified, sellerSection: sellerSection.slice(0, 200),
          phones: [...phoneMatch, ...phoneMatch2],
          whatsappHref: whatsappHref.slice(0, 150),
          hasPhoneBtn: !!phoneBtn,
        };
      });

      console.log(`  Title: ${data.title?.slice(0, 60)}`);
      console.log(`  Price: $${data.price}`);
      console.log(`  Agency: ${data.isAgency} (verified: ${data.isVerified})`);
      console.log(`  Seller: ${data.sellerSection.slice(0, 80)}`);
      console.log(`  Location: ${data.location}`);
      console.log(`  ${data.superficie} | ${data.habitaciones} hab | ${data.banos} baños | ${data.antiguedad}`);
      console.log(`  Phones: ${data.phones.join(", ") || "none"}`);
      console.log(`  WhatsApp: ${data.whatsappHref.slice(0, 80)}`);
      console.log(`  Has phone button: ${data.hasPhoneBtn}`);
      console.log(`  Description: ${data.description.slice(0, 100)}...`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})().catch(console.error);
