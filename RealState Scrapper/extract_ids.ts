import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "infoScrapeada", "inmuebles_scraped.json"), "utf-8"));
const urls = data.map((d: any) => d.fuenteScraping?.urlOriginal).filter(Boolean) as string[];
console.log("Total properties in infoScrapeada:", urls.length);

const ids = new Set<string>();
for (const u of urls) {
  const m = u.match(/stay\/(\d+)/);
  if (m) ids.add(m[1]);
}
console.log("Unique property IDs:", ids.size);
ids.forEach((id) => console.log(id));
