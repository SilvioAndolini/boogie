import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROPERTIES_DIR = path.join(__dirname, "properties");

function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        file.close(); fs.unlink(dest, () => {});
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
  });
}

async function downloadImagesForProperty(propDir: string) {
  const dataFile = path.join(propDir, "data.json");
  if (!fs.existsSync(dataFile)) return;

  const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  if (!data.imagenes || data.imagenes.length === 0) return;

  const imgDir = path.join(propDir, "img");
  ensureDir(imgDir);

  let downloaded = 0;
  for (let i = 0; i < data.imagenes.length; i++) {
    const img = data.imagenes[i];
    if (!img.url) continue;

    const ext = img.url.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1] || "jpg";
    const filename = `img_${i + 1}.${ext}`;
    const filepath = path.join(imgDir, filename);

    if (fs.existsSync(filepath)) { downloaded++; continue; }

    try {
      await downloadFile(img.url, filepath);
      data.imagenes[i].archivoLocal = `img/${filename}`;
      downloaded++;
    } catch {
      data.imagenes[i].archivoLocal = "";
    }
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
  return downloaded;
}

async function main() {
  const folders = fs.readdirSync(PROPERTIES_DIR).filter((f) =>
    fs.statSync(path.join(PROPERTIES_DIR, f)).isDirectory()
  );

  console.log(`Propiedades con data.json: ${folders.length}`);
  console.log("Descargando imágenes...\n");

  let total = 0, skipped = 0, errors = 0;
  for (let i = 0; i < folders.length; i++) {
    const dir = path.join(PROPERTIES_DIR, folders[i]);
    const imgDir = path.join(dir, "img");
    const dataFile = path.join(dir, "data.json");

    if (!fs.existsSync(dataFile)) continue;

    const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    const imgCount = data.imagenes?.length || 0;
    if (imgCount === 0) { skipped++; continue; }

    const existing = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => f.startsWith("img_")).length : 0;
    if (existing >= imgCount) {
      if (i % 20 === 0) process.stdout.write(`\r  [${i}/${folders.length}] ya descargadas`);
      continue;
    }

    try {
      const count = await downloadImagesForProperty(dir);
      total += count || 0;
      if (i % 5 === 0) process.stdout.write(`\r  [${i}/${folders.length}] descargadas: ${total}`);
    } catch {
      errors++;
    }
  }

  console.log(`\n\nResumen:`);
  console.log(`  Imágenes descargadas: ${total}`);
  console.log(`  Propiedades sin imágenes: ${skipped}`);
  console.log(`  Errores: ${errors}`);
}

main().catch(console.error);
