/**
 * Scrapper unificado: estei.app → Supabase
 *
 * Pipeline completo:
 *   1. Scrapea páginas de búsqueda con Playwright
 *   2. Descarga imágenes y las procesa con Sharp (webp + thumbnails)
 *   3. Sube imágenes a Supabase Storage
 *   4. Inserta propiedades + imágenes + amenidades en la BD
 *
 * Uso:
 *   npx dotenvx run -f .env.local -- npx tsx scripts/scraper-unificado.ts
 *   npx dotenvx run -f .env.local -- npx tsx scripts/scraper-unificado.ts --dry-run
 *   npx dotenvx run -f .env.local -- npx tsx scripts/scraper-unificado.ts --max 20
 *   npx dotenvx run -f .env.local -- npx tsx scripts/scraper-unificado.ts --ciudades Caracas,Margarita
 */

import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '.env.local') })

import { chromium, type Browser, type Page } from 'playwright'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { mkdir, unlink } from 'fs/promises'

// ─── Config ──────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const BUCKET_NAME = 'propiedades'

const TIPOS_VALIDOS = new Set([
  'APARTAMENTO', 'CASA', 'VILLA', 'CABANA', 'ESTUDIO',
  'HABITACION', 'LOFT', 'PENTHOUSE', 'FINCA', 'OTRO',
])

const ESTADOS_VENEZUELA = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
  'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
  'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
]

const IMAGEN_CONFIG = {
  maxAncho: 1920,
  maxAlto: 1200,
  calidad: 80,
  thumbAncho: 400,
  thumbCalidad: 75,
  maxBytes: 5 * 1024 * 1024,
  timeout: 15000,
} as const

const CIUDADES_DEFAULT = [
  { nombre: 'Caracas', estado: 'Distrito Capital', lat: 10.4806, lng: -66.9036, zoom: 12 },
  { nombre: 'Margarita', estado: 'Nueva Esparta', lat: 10.9364, lng: -64.0989, zoom: 10 },
  { nombre: 'La Guaira', estado: 'Vargas', lat: 10.601, lng: -66.9699, zoom: 12 },
]

interface ImagenScrapeada {
  url: string
  alt: string | null
  orden: number
  esPrincipal: boolean
}

interface PropiedadScrapeada {
  titulo: string
  descripcion: string
  tipoPropiedad: string
  precioPorNoche: number
  moneda: string
  capacidadMaxima: number
  habitaciones: number
  banos: number
  camas: number
  direccion: string
  ciudad: string
  estado: string
  zona: string | null
  imagenes: ImagenScrapeada[]
  amenidades: string[]
  fuenteUrl: string
}

interface ImagenProcesada {
  url: string
  thumbnailUrl: string
  alt: string | null
  orden: number
  esPrincipal: boolean
}

// ─── Argumentos CLI ──────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const maxPropiedades = parseInt(args[args.indexOf('--max') + 1]) || 50
const ciudadesArg = args[args.indexOf('--ciudades') + 1]
const ciudadesFiltro = ciudadesArg ? ciudadesArg.split(',') : null
const saltarImagenes = args.includes('--skip-images')

// ─── Supabase ────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET_NAME)) {
    console.log(`  Creando bucket "${BUCKET_NAME}"...`)
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    })
  }
}

async function findPropietario(): Promise<string> {
  const { data: admin } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('rol', 'ADMIN')
    .limit(1)
    .single()

  if (admin) {
    console.log(`  Propietario: ${admin.email}`)
    return admin.id
  }

  const { data: any } = await supabase
    .from('usuarios')
    .select('id, email')
    .limit(1)
    .single()

  if (any) {
    console.log(`  Propietario: ${any.email}`)
    return any.id
  }

  throw new Error('No hay usuarios en la BD. Registra uno primero.')
}

// ─── Scraping ────────────────────────────────────────────

async function aceptarCookies(page: Page) {
  try {
    const btn = page.locator('button:has-text("Aceptar")')
    if (await btn.isVisible({ timeout: 3000 })) {
      await btn.click()
      await page.waitForTimeout(500)
    }
  } catch {}
}

async function scrapeSearchPage(page: Page, url: string): Promise<any[]> {
  console.log(`  Scraping: ${url.substring(0, 70)}...`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await aceptarCookies(page)
  await page.waitForTimeout(8000)

  const estadosVE = ESTADOS_VENEZUELA

  const cards = await page.evaluate((estados: string[]) => {
    const results: any[] = []
    const stayCards = document.querySelectorAll('[data-testid="stay-card"]')

    stayCards.forEach((card, index) => {
      const data: any = { index }

      const link = card.querySelector('a')
      data.profileUrl = link?.href || null
      data.texto = card.textContent?.trim().substring(0, 500) || ''

      data.imagenes = Array.from(card.querySelectorAll('img'))
        .filter(img => {
          const src = img.src || ''
          return src.startsWith('http') && !src.includes('data:') && !src.includes('googleapis.com')
        })
        .slice(0, 5)
        .map((img, idx) => ({
          url: img.src,
          alt: img.alt || null,
          orden: idx + 1,
          esPrincipal: idx === 0,
        }))

      const priceMatch = card.textContent?.match(/\$([\d,]+(?:\.\d{2})?)/)
      if (priceMatch) data.precioTexto = priceMatch[1]

      const lines = card.textContent?.trim().split('\n').map(l => l.trim()).filter(Boolean) || []
      const stateLine = lines.find(l => ESTADOS_VENEZUELA.some(e => l === e))
      if (stateLine) data.estadoTexto = stateLine

      const roomsMatch = card.textContent?.match(/(\d+)\s*(?:hab|habitaci)/i)
      if (roomsMatch) data.habitaciones = parseInt(roomsMatch[1])

      const bathsMatch = card.textContent?.match(/(\d+)\s*(?:baño|bath)/i)
      if (bathsMatch) data.banos = parseInt(bathsMatch[1])

      const guestsMatch = card.textContent?.match(/(\d+)\s*(?:huésped|guest|huesped|viajero)/i)
      if (guestsMatch) data.capacidadMaxima = parseInt(guestsMatch[1])

      results.push(data)
    })

    return results
  })

  console.log(`    Encontradas: ${cards.length} tarjetas`)
  return cards
}

function parseCard(raw: any, ciudadConfig: { nombre: string; estado: string }): PropiedadScrapeada {
  let titulo = 'Sin título'
  if (raw.imagenes?.length > 0 && raw.imagenes[0].alt && raw.imagenes[0].alt !== 'null') {
    titulo = raw.imagenes[0].alt
      .replace(/-/g, ' ')
      .replace(/\s*\d+$/, '')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim()
  }

  const textoLower = raw.texto?.toLowerCase() || ''
  let tipoPropiedad = 'APARTAMENTO'
  if (textoLower.includes('hotel')) tipoPropiedad = 'OTRO'
  else if (textoLower.includes('casa')) tipoPropiedad = 'CASA'
  else if (textoLower.includes('villa')) tipoPropiedad = 'VILLA'
  else if (textoLower.includes('cabaña') || textoLower.includes('cabana')) tipoPropiedad = 'CABANA'
  else if (textoLower.includes('penthouse')) tipoPropiedad = 'PENTHOUSE'
  else if (textoLower.includes('loft')) tipoPropiedad = 'LOFT'
  else if (textoLower.includes('estudio')) tipoPropiedad = 'ESTUDIO'
  else if (textoLower.includes('habitación') || textoLower.includes('habitacion')) tipoPropiedad = 'HABITACION'

  let precio = 50
  if (raw.precioTexto) {
    precio = parseFloat(raw.precioTexto.replace(/,/g, '')) || 50
  }

  const estado = raw.estadoTexto || ciudadConfig.estado

  const amenidades = ['WiFi', 'Aire acondicionado']
  if (textoLower.includes('piscina') || textoLower.includes('pool')) amenidades.push('Piscina')
  if (textoLower.includes('parking') || textoLower.includes('estacionamiento') || textoLower.includes('parqueo')) amenidades.push('Estacionamiento')
  if (textoLower.includes('cocina') || textoLower.includes('kitchen')) amenidades.push('Cocina')
  if (textoLower.includes('lavadora') || textoLower.includes('washer')) amenidades.push('Lavadora')
  if (textoLower.includes('mascota') || textoLower.includes('pet')) amenidades.push('Mascotas permitidas')
  if (textoLower.includes('tv') || textoLower.includes('televisor')) amenidades.push('TV')
  if (textoLower.includes('seguridad') || textoLower.includes('security')) amenidades.push('Seguridad 24h')

  const direccion = `${ciudadConfig.nombre}, ${estado}, Venezuela`

  return {
    titulo,
    descripcion: raw.texto || `Propiedad en ${ciudadConfig.nombre}, Venezuela.`,
    tipoPropiedad,
    precioPorNoche: precio,
    moneda: 'USD',
    capacidadMaxima: raw.capacidadMaxima || 2,
    habitaciones: raw.habitaciones || 1,
    banos: raw.banos || 1,
    camas: raw.habitaciones || 1,
    direccion,
    ciudad: ciudadConfig.nombre,
    estado,
    zona: null,
    imagenes: raw.imagenes || [],
    amenidades,
    fuenteUrl: raw.profileUrl || 'https://estei.app',
  }
}

// ─── Pipeline de imágenes ────────────────────────────────

async function descargarImagen(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), IMAGEN_CONFIG.timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    clearTimeout(timer)

    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > IMAGEN_CONFIG.maxBytes) return null

    return buffer
  } catch {
    return null
  }
}

async function procesarImagen(buffer: Buffer): Promise<{ principal: Buffer; thumbnail: Buffer } | null> {
  try {
    const meta = await sharp(buffer).metadata()
    if (!meta.width || !meta.height) return null

    const principal = await sharp(buffer)
      .resize(IMAGEN_CONFIG.maxAncho, IMAGEN_CONFIG.maxAlto, { fit: 'cover', position: 'attention' })
      .webp({ quality: IMAGEN_CONFIG.calidad })
      .toBuffer()

    const thumbnail = await sharp(buffer)
      .resize(IMAGEN_CONFIG.thumbAncho, null, { fit: 'inside' })
      .webp({ quality: IMAGEN_CONFIG.thumbCalidad })
      .toBuffer()

    return { principal, thumbnail }
  } catch {
    return null
  }
}

async function subirImagen(principal: Buffer, thumbnail: Buffer, propiedadId: string, filename: string) {
  const basePath = `boogie-scrape/${propiedadId}`
  const principalPath = `${basePath}/${filename}`
  const thumbPath = `${basePath}/thumb_${filename}`

  const [upPrincipal, upThumb] = await Promise.all([
    supabase.storage.from(BUCKET_NAME).upload(principalPath, principal, {
      contentType: 'image/webp',
      upsert: true,
    }),
    supabase.storage.from(BUCKET_NAME).upload(thumbPath, thumbnail, {
      contentType: 'image/webp',
      upsert: true,
    }),
  ])

  if (upPrincipal.error) {
    console.error(`    Error subiendo ${filename}: ${upPrincipal.error.message}`)
    return null
  }
  if (upThumb.error) {
    console.error(`    Error subiendo thumb ${filename}: ${upThumb.error.message}`)
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(principalPath)
  const { data: thumbUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbPath)

  return {
    url: urlData.publicUrl,
    thumbnailUrl: thumbUrlData.publicUrl,
  }
}

async function procesarImagenesPropiedad(
  imagenes: ImagenScrapeada[],
  propiedadId: string,
): Promise<ImagenProcesada[]> {
  const resultado: ImagenProcesada[] = []

  for (const img of imagenes) {
    console.log(`    Descargando: ${img.url.substring(0, 60)}...`)
    const buffer = await descargarImagen(img.url)
    if (!buffer) {
      console.log(`    Saltando (error descarga): ${img.url.substring(0, 50)}`)
      continue
    }

    const procesada = await procesarImagen(buffer)
    if (!procesada) {
      console.log(`    Saltando (error procesamiento): ${img.url.substring(0, 50)}`)
      continue
    }

    const filename = `${randomUUID()}.webp`
    const urls = await subirImagen(procesada.principal, procesada.thumbnail, propiedadId, filename)
    if (!urls) continue

    resultado.push({
      url: urls.url,
      thumbnailUrl: urls.thumbnailUrl,
      alt: img.alt,
      orden: img.orden,
      esPrincipal: img.esPrincipal,
    })

    console.log(`    OK: ${filename} (${Math.round(procesada.principal.length / 1024)}KB)`)
  }

  return resultado
}

// ─── Importar a BD ───────────────────────────────────────

async function importarPropiedad(
  prop: PropiedadScrapeada,
  imagenesProcesadas: ImagenProcesada[],
  propietarioId: string,
): Promise<{ exito: boolean; id?: string; error?: string }> {
  const tipoNormalizado = TIPOS_VALIDOS.has(prop.tipoPropiedad) ? prop.tipoPropiedad : 'OTRO'

  const propiedadData = {
    id: `boogie_${randomUUID().substring(0, 12)}`,
    titulo: prop.titulo,
    descripcion: prop.descripcion,
    tipo_propiedad: tipoNormalizado,
    precio_por_noche: prop.precioPorNoche,
    moneda: prop.moneda || 'USD',
    capacidad_maxima: prop.capacidadMaxima,
    habitaciones: prop.habitaciones,
    banos: prop.banos,
    camas: prop.camas,
    direccion: prop.direccion,
    ciudad: prop.ciudad,
    estado: prop.estado,
    zona: prop.zona,
    politica_cancelacion: 'MODERADA',
    horario_checkin: '15:00',
    horario_checkout: '11:00',
    estancia_minima: 1,
    estancia_maxima: 30,
    estado_publicacion: 'PUBLICADA',
    propietario_id: propietarioId,
    fecha_publicacion: new Date().toISOString(),
    destacada: false,
    total_resenas: 0,
    vistas_totales: 0,
  }

  const { data: propiedad, error: propError } = await supabase
    .from('propiedades')
    .insert(propiedadData)
    .select('id')
    .single()

  if (propError) {
    return { exito: false, error: propError.message }
  }

  if (imagenesProcesadas.length > 0) {
    const imagenesData = imagenesProcesadas.map(img => ({
      url: img.url,
      thumbnail_url: img.thumbnailUrl,
      alt: img.alt,
      orden: img.orden,
      es_principal: img.esPrincipal,
      propiedad_id: propiedad.id,
    }))

    const { error: imgError } = await supabase
      .from('imagenes_propiedad')
      .insert(imagenesData)

    if (imgError) {
      console.log(`    Warning: Error insertando imágenes: ${imgError.message}`)
    }
  }

  for (const amenidadNombre of prop.amenidades) {
    const { data: existente } = await supabase
      .from('amenidades')
      .select('id')
      .eq('nombre', amenidadNombre)
      .single()

    let amenidadId = existente?.id
    if (!amenidadId) {
      const { data: nueva } = await supabase
        .from('amenidades')
        .insert({ nombre: amenidadNombre, categoria: 'COMODIDADES' })
        .select('id')
        .single()
      amenidadId = nueva?.id
    }

    if (amenidadId) {
      await supabase.from('propiedad_amenidades').insert({
        propiedad_id: propiedad.id,
        amenidad_id: amenidadId,
      })
    }
  }

  return { exito: true, id: propiedad.id }
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log('SCRAPPER UNIFICADO: estei.app -> Supabase')
  console.log('='.repeat(60))
  console.log(`Modo: ${dryRun ? 'DRY RUN' : 'IMPORTAR'}`)
  console.log(`Max propiedades: ${maxPropiedades}`)
  console.log(`Procesar imagenes: ${saltarImagenes ? 'NO' : 'SI'}`)
  console.log('')

  let propietarioId = ''
  if (!dryRun) {
    console.log('Configurando Supabase...')
    await ensureBucket()
    propietarioId = await findPropietario()
    console.log('')
  }

  console.log('Iniciando navegador...')
  const browser: Browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  })
  const page = await context.newPage()

  // Navegar a la home y aceptar cookies
  console.log('Aceptando cookies...')
  await page.goto('https://estei.app', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await aceptarCookies(page)

  const ciudades = CIUDADES_DEFAULT.filter(c =>
    !ciudadesFiltro || ciudadesFiltro.some(f => c.nombre.toLowerCase().includes(f.toLowerCase()))
  )

  const todasPropiedades: PropiedadScrapeada[] = []
  const resultados: { titulo: string; exito: boolean; error?: string }[] = []

  try {
    // ── Fase 1: Scrapear ──
    console.log(`\nFASE 1: SCRAPING`)
    console.log('-'.repeat(40))

    for (const ciudad of ciudades) {
      const url = `https://estei.app/search?search_text=${ciudad.nombre}&lat=${ciudad.lat}&lng=${ciudad.lng}&zoom=${ciudad.zoom}&guests=1`
      const cards = await scrapeSearchPage(page, url)

      for (const card of cards) {
        if (todasPropiedades.length >= maxPropiedades) break
        const prop = parseCard(card, ciudad)
        if (prop.imagenes.length === 0) continue
        todasPropiedades.push(prop)
      }

      await page.waitForTimeout(2000)
      if (todasPropiedades.length >= maxPropiedades) break
    }

    console.log(`\nPropiedades scrapeadas: ${todasPropiedades.length}`)

    // ── Fase 2: Procesar imágenes e importar ──
    console.log(`\nFASE 2: PROCESAMIENTO E IMPORTACION`)
    console.log('-'.repeat(40))

    for (let i = 0; i < todasPropiedades.length; i++) {
      const prop = todasPropiedades[i]
      console.log(`\n[${i + 1}/${todasPropiedades.length}] ${prop.titulo}`)
      console.log(`  ${prop.ciudad}, ${prop.estado} | $${prop.precioPorNoche} | ${prop.imagenes.length} imgs`)

      if (dryRun) {
        resultados.push({ titulo: prop.titulo, exito: true })
        continue
      }

      let imagenesProcesadas: ImagenProcesada[] = []
      if (!saltarImagenes && prop.imagenes.length > 0) {
        const tempId = `boogie_${randomUUID().substring(0, 12)}`
        imagenesProcesadas = await procesarImagenesPropiedad(prop.imagenes, tempId)
        console.log(`  Imagenes procesadas: ${imagenesProcesadas.length}/${prop.imagenes.length}`)
      }

      const result = await importarPropiedad(prop, imagenesProcesadas, propietarioId)
      if (result.exito) {
        console.log(`  Importada OK (id: ${result.id})`)
        resultados.push({ titulo: prop.titulo, exito: true })
      } else {
        console.log(`  ERROR: ${result.error}`)
        resultados.push({ titulo: prop.titulo, exito: false, error: result.error })
      }
    }

    // ── Resumen ──
    console.log(`\n${'='.repeat(60)}`)
    console.log('RESUMEN')
    console.log('='.repeat(60))
    const exitosos = resultados.filter(r => r.exito).length
    const fallidos = resultados.filter(r => !r.exito).length
    console.log(`Exitosas: ${exitosos}`)
    console.log(`Fallidas: ${fallidos}`)
    console.log(`Total: ${resultados.length}`)

    if (dryRun) {
      console.log('\n[DRY RUN] No se realizaron cambios en la BD.')
    }

    if (fallidos > 0) {
      console.log('\nErrores:')
      resultados.filter(r => !r.exito).forEach(r => {
        console.log(`  - ${r.titulo}: ${r.error}`)
      })
    }

  } finally {
    await browser.close()
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error fatal:', e)
    process.exit(1)
  })
