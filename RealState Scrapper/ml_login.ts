import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });

  const page = await ctx.newPage();
  await page.goto("https://www.mercadolibre.com.ve/gz/account-verification?go=https%3A%2F%2Flistado.mercadolibre.com.ve%2Finmuebles%2Fapartamentos%2Falquiler%2F", { waitUntil: "domcontentloaded", timeout: 30000 });

  console.log("Navegador abierto. Logeate con tus credenciales.");
  console.log("Esperando a que la pagina de listado cargue...");

  await page.waitForURL("**/listado.mercadolibre.com.ve/**", { timeout: 300000 });
  console.log("Login exitoso! Pagina de listado cargada.");

  await new Promise(r => setTimeout(r, 3000));

  const statePath = path.join(__dirname, "ml_auth.json");
  await ctx.storageState({ path: statePath });
  console.log(`Cookies guardadas en: ${statePath}`);

  const cookies = await ctx.cookies();
  console.log(`Total cookies: ${cookies.length}`);

  await page.close();
  await browser.close();
  console.log("Listo. Ya puedes cerrar esta ventana.");
})().catch(console.error);
