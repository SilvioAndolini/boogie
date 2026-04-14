import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "index.json"), "utf-8"));

console.log(`Total propiedades: ${data.length}`);
console.log(`Con precio: ${data.filter((p: any) => p.url).length}`);

console.log("\nPrimeras 10:");
data.slice(0, 10).forEach((p: any, i: number) => console.log(`  ${i + 1}. ${p.titulo}`));

console.log("\nÚltimas 10:");
data.slice(-10).forEach((p: any, i: number) => console.log(`  ${data.length - 9 + i}. ${p.titulo}`));

console.log(`\nID: ${data[0]?.id}`);
console.log(`Carpeta: ${data[0]?.carpeta}`);

// Check one property file
const propFile = path.join(__dirname, "properties", data[0]?.carpeta, "data.json");
if (fs.existsSync(propFile)) {
  const prop = JSON.parse(fs.readFileSync(propFile, "utf-8"));
  console.log("\nEjemplo propiedad:");
  console.log(`  Título: ${prop.titulo}`);
  console.log(`  Precio: $${prop.precioPorNoche || "?"}`);
  console.log(`  Imágenes: ${prop.imagenes?.length || 0}`);
  console.log(`  Amenidades: ${prop.amenidades?.join(", ") || "ninguna"}`);
  console.log(`  Descripción: ${prop.descripcion?.slice(0, 100)}...`);
}
