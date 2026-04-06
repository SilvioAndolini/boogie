/**
 * Script de procesamiento de imágenes para Boogie
 *
 * Recorta y optimiza imágenes de propiedades a aspect ratios fijos:
 * - Horizontal: 16:10 (1920×1200)
 * - Vertical: 3:4 (1080×1440)
 * - Thumbnails: 400px ancho
 *
 * Uso: npx tsx scripts/process-images.ts [--force]
 */

import sharp from 'sharp'
import { readdir, mkdir } from 'fs/promises'
import { join, basename } from 'path'

// Configuración de aspect ratios fijos
const CONFIG = {
  horizontal: { width: 1920, height: 1200, label: 'horizontal' },
  vertical: { width: 1080, height: 1440, label: 'vertical' },
  thumbnail: { width: 400, quality: 75 },
  quality: 80,
} as const

const INPUT_DIR = join(process.cwd(), 'imagenes')
const OUTPUT_DIR = join(process.cwd(), 'imagenes', 'processed')

interface ProcessedImage {
  filename: string
  originalFile: string
  orientation: 'horizontal' | 'vertical'
  width: number
  height: number
  fileSize: number
  thumbnailFile: string
  thumbnailSize: number
}

async function processImages(force = false) {
  console.log('🖼️  Procesamiento de imágenes Boogie\n')

  // Crear directorios de salida
  const dirs = ['horizontal', 'vertical', 'thumbnails']
  for (const dir of dirs) {
    await mkdir(join(OUTPUT_DIR, dir), { recursive: true })
  }

  // Leer imágenes de entrada
  const files = (await readdir(INPUT_DIR))
    .filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))

  if (files.length === 0) {
    console.error('❌ No se encontraron imágenes en', INPUT_DIR)
    process.exit(1)
  }

  console.log(`📂 Encontradas ${files.length} imágenes\n`)

  const manifest: ProcessedImage[] = []

  for (const file of files) {
    const inputPath = join(INPUT_DIR, file)
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      console.warn(`⚠️  Saltando ${file}: no se pudo determinar dimensiones`)
      continue
    }

    const isHorizontal = metadata.width >= metadata.height
    const orientation = isHorizontal ? 'horizontal' : 'vertical'
    const target = isHorizontal ? CONFIG.horizontal : CONFIG.vertical
    const outputFilename = `${basename(file, extname(file))}.webp`

    console.log(`  ${isHorizontal ? '↔️' : '↕️'}  ${file} (${metadata.width}×${metadata.height}) → ${target.width}×${target.height}`)

    // Procesar imagen principal (recorte con cover + attention)
    const outputPath = join(OUTPUT_DIR, orientation, outputFilename)

    if (force || !(await exists(outputPath))) {
      await image
        .resize(target.width, target.height, {
          fit: 'cover',
          position: 'attention',
        })
        .webp({ quality: CONFIG.quality })
        .toFile(outputPath)
    } else {
      console.log(`     ⏭️  Ya existe, saltando (usar --force para sobreescribir)`)
    }

    // Generar thumbnail
    const thumbPath = join(OUTPUT_DIR, 'thumbnails', outputFilename)
    await sharp(inputPath)
      .resize(CONFIG.thumbnail.width, null, { fit: 'inside' })
      .webp({ quality: CONFIG.thumbnail.quality })
      .toFile(thumbPath)

    // Obtener tamaños de los archivos procesados
    const processedStat = await sharp(outputPath).metadata()
    const thumbStat = await sharp(thumbPath).metadata()

    manifest.push({
      filename: outputFilename,
      originalFile: file,
      orientation,
      width: target.width,
      height: target.height,
      fileSize: processedStat.size || 0,
      thumbnailFile: outputFilename,
      thumbnailSize: thumbStat.size || 0,
    })
  }

  // Guardar manifest
  const manifestPath = join(OUTPUT_DIR, 'manifest.json')
  const { writeFile } = await import('fs/promises')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`\n✅ Procesadas ${manifest.length} imágenes`)
  console.log(`📋 Manifest guardado en ${manifestPath}`)
}

async function exists(path: string): Promise<boolean> {
  try {
    const { stat } = await import('fs/promises')
    await stat(path)
    return true
  } catch {
    return false
  }
}

function extname(path: string): string {
  const i = path.lastIndexOf('.')
  return i >= 0 ? path.slice(i) : ''
}

// Ejecutar
const force = process.argv.includes('--force')
processImages(force)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
