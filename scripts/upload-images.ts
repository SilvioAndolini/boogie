/**
 * Script de upload de imágenes procesadas a Supabase Storage
 *
 * Sube las imágenes procesadas (Fase 1) al bucket público de Supabase
 * y genera un manifest con las URLs públicas.
 *
 * Uso: npx tsx scripts/upload-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFile, readdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env.local
config({ path: join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const BUCKET_NAME = 'propiedades'
const PROPERTY_FOLDER = 'seed-boogie-1'

const PROCESSED_DIR = join(process.cwd(), 'imagenes', 'processed')

interface UploadEntry {
  filename: string
  orientation: 'horizontal' | 'vertical'
  url: string
  thumbnailUrl: string
  esPrincipal: boolean
}

async function uploadImages() {
  console.log('📤 Upload de imágenes a Supabase Storage\n')

  // 1. Crear bucket si no existe
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!bucketExists) {
    console.log(`🪣 Creando bucket "${BUCKET_NAME}"...`)
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    })
    if (error) {
      console.error('❌ Error creando bucket:', error.message)
      process.exit(1)
    }
    console.log('✅ Bucket creado')
  } else {
    console.log(`🪣 Bucket "${BUCKET_NAME}" ya existe`)
  }

  // 2. Leer manifest de imágenes procesadas
  const manifestPath = join(PROCESSED_DIR, 'manifest.json')
  const manifestRaw = await readFile(manifestPath, 'utf-8')
  const manifest = JSON.parse(manifestRaw)

  const uploadEntries: UploadEntry[] = []

  for (const entry of manifest) {
    const { filename, orientation } = entry

    // Subir imagen principal
    const imagePath = join(PROCESSED_DIR, orientation, filename)
    const imageBuffer = await readFile(imagePath)
    const storagePath = `${PROPERTY_FOLDER}/${filename}`

    console.log(`  📤 Subiendo ${filename}...`)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      console.error(`  ❌ Error subiendo ${filename}:`, uploadError.message)
      continue
    }

    // Subir thumbnail
    const thumbPath = join(PROCESSED_DIR, 'thumbnails', filename)
    const thumbBuffer = await readFile(thumbPath)
    const thumbStoragePath = `${PROPERTY_FOLDER}/thumbnails/${filename}`

    await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbStoragePath, thumbBuffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    // Obtener URLs públicas
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    const { data: thumbUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbStoragePath)

    uploadEntries.push({
      filename,
      orientation,
      url: urlData.publicUrl,
      thumbnailUrl: thumbUrlData.publicUrl,
      esPrincipal: uploadEntries.length === 0,
    })

    console.log(`  ✅ ${orientation} → ${Math.round(imageBuffer.length / 1024)}KB`)
  }

  // 3. Guardar manifest de upload
  const outputPath = join(process.cwd(), 'scripts', 'upload-manifest.json')
  await writeFile(outputPath, JSON.stringify(uploadEntries, null, 2))

  console.log(`\n✅ ${uploadEntries.length} imágenes subidas`)
  console.log(`📋 Manifest guardado en ${outputPath}`)
}

uploadImages()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
