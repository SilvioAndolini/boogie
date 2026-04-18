import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation,resolution=merge-duplicates',
}

const PROPERTIES_DIR = path.resolve(__dirname, 'RealState Scrapper/properties')
const OWNER_ID = 'b4015167-0a4a-45ca-b4a4-ff5b20adf697'

const AMENITY_MAP: Record<string, string> = {
  'WiFi': 'Wi-Fi',
  'WIFI': 'Wi-Fi',
  'wifi': 'Wi-Fi',
  'Aire acondicionado': 'Aire acondicionado',
  'Agua caliente': 'Agua caliente',
  'Toallas': 'Toallas',
  'Estacionamiento': 'Estacionamiento',
  'TV': 'TV',
  'Lavadora': 'Lavadora',
  'Piscina': 'Piscina',
  'Cafetera': 'Cafetera',
  'Microondas': 'Microondas',
  'Secadora': 'Lavadora',
  'Refrigerador': 'Refrigerador',
  'Nevera': 'Refrigerador',
  'Cocina equipada': 'Cocina completa',
  'Cocina completa': 'Cocina completa',
  'Utensilios de cocina': 'Utensilios de cocina',
  'Vajilla': 'Utensilios de cocina',
  'Juego de ollas': 'Utensilios de cocina',
  'Juego de cubiertos': 'Utensilios de cocina',
  'Vasos': 'Utensilios de cocina',
  'Mesa de comedor': 'Utensilios de cocina',
  'Plancha': 'Plancha',
  'Secador de pelo': 'Secador de pelo',
  'Baño privado': 'Baño privado',
  'Parrilla': 'Parrilla',
  'Terraza/Balcón': 'Terraza/Balcón',
  'Terraza': 'Terraza/Balcón',
  'Balcón': 'Terraza/Balcón',
  'Patio': 'Terraza/Balcón',
  'Jardín': 'Jardín',
  'Jardin': 'Jardín',
  'Vista al mar': 'Vista al mar',
  'Cámaras de seguridad': 'Cámaras de seguridad',
  'Mascotas': 'Se permiten mascotas',
  'Playa': 'Vista al mar',
  'Tanque de agua': 'Agua caliente',
  'Ventilador': 'Ventilador',
  'Área de BBQ': 'Área de BBQ',
  'BBQ': 'Área de BBQ',
  'Caja fuerte': 'Caja fuerte',
  'Extintor': 'Extintor',
  'Detector de humo': 'Detector de humo',
  'Escritorio': 'Escritorio de trabajo',
  'Adecuado para familias': 'Adecuado para familias',
  'Check-in self service': 'Check-in self service',
}

const NOISE = new Set([
  'Check-in:', 'Check-out:', 'Habitaciones disponibles', 'Disponibilidad',
  'Horarios', 'Reiniciar fechas', 'Conoce a tu anfitrión', 'Anfitrión',
  'Reseñas', 'Calificación', 'Meses siendo anfitrión', 'Año siendo anfitrión',
  'Mensaje al anfitrión', 'Ubicación', 'Políticas', 'Política de cancelación',
  'Más información', '/ noche', 'Check In', 'Check Out', 'Viajeros',
  '1 Viajero', 'Reservación de alojamiento', 'Servicio Estei',
  'Total (Impuestos incluidos)', 'Solicitar Reserva', 'Explora Estei',
  'Tus alojamientos', 'Tus viajes', 'Seguridad y confianza', 'Conoce Estei',
  'Sobre nosotros', 'Soporte', 'Atención al Cliente', 'Ayuda cercana',
  'Términos y condiciones', 'Políticas de privacidad', 'Redes Sociales',
  '© 2024 Estei y', 'Avila Tek', '. Todos los derechos reservados', 'Estei',
  'Keyboard shortcuts', 'Map data ©2026', 'Terms', 'Report a map error',
  'Ver más información', 'Ver más', 'es anfitrión',
])

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_SET = new Set(['Do','Lu','Ma','Mi','Ju','Vi','Sa'])

function isNoise(item: string): boolean {
  if (NOISE.has(item)) return true
  if (/^\d{4}$/.test(item)) return true
  if (MONTHS.some(m => item.startsWith(m) && /\d{4}$/.test(item))) return true
  if (DAYS_SET.has(item)) return true
  if (/^\d{1,2}$/.test(item)) return true
  if (/^\d+\s+(Aire|Almohada|Baño|Cama|Cobija|Closet|Secador|Toalla)/i.test(item)) return true
  if (/^Habitaci[oó]n/i.test(item) && !item.includes('privado')) return true
  if (/^\$\d+/.test(item)) return true
  if (/^\d+\s+Viajero/.test(item)) return true
  return false
}

function extractPrice(precioPorNoche: number | null, precioOriginal: string, descripcion: string, amenidades: string[]): number {
  if (precioPorNoche && precioPorNoche > 0) return precioPorNoche
  if (precioOriginal) {
    const m = precioOriginal.match(/\$(\d+)/)
    if (m) return parseFloat(m[1])
  }
  for (const item of amenidades) {
    const bcv = item.match(/^\$(\d+)\s*\(BCV\)/)
    if (bcv) return parseFloat(bcv[1])
    const dot00 = item.match(/^\$(\d+)\.00$/)
    if (dot00) return parseFloat(dot00[1])
    const usd = item.match(/^\$(\d+)\s*USD/i)
    if (usd) return parseFloat(usd[1])
  }
  for (const p of [/\$(\d+)\s*\(BCV\)/, /\$(\d+)\s*USD/i, /\$(\d+)\s*(?:\/\s*noche|por noche)/i, /\$(\d+)\.00/, /(\d+)\s*USD/i]) {
    const m = descripcion.match(p)
    if (m) return parseFloat(m[1])
  }
  return 0
}

const VALID_TIPOS = new Set(['APARTAMENTO','CASA','VILLA','CABANA','ESTUDIO','HABITACION','LOFT','PENTHOUSE','FINCA','OTRO'])

function mapTipo(tipo: string): string {
  if (VALID_TIPOS.has(tipo)) return tipo
  const l = tipo.toLowerCase()
  if (l.includes('casa')) return 'CASA'
  if (l.includes('apartamento') || l.includes('apto')) return 'APARTAMENTO'
  if (l.includes('villa')) return 'VILLA'
  if (l.includes('cabana') || l.includes('cabaña')) return 'CABANA'
  if (l.includes('estudio') || l.includes('monoambiente')) return 'ESTUDIO'
  if (l.includes('habitacion') || l.includes('habitación')) return 'HABITACION'
  if (l.includes('loft')) return 'LOFT'
  if (l.includes('penthouse') || l.includes('ph')) return 'PENTHOUSE'
  if (l.includes('posada') || l.includes('hotel')) return 'OTRO'
  return 'APARTAMENTO'
}

const ESTADOS_MAP: Record<string, string> = {
  'Nueva Esparta':'Nueva Esparta','Miranda':'Miranda','Distrito Capital':'Distrito Capital',
  'La Guaira':'La Guaira','Vargas':'La Guaira','Aragua':'Aragua','Carabobo':'Carabobo',
  'Zulia':'Zulia','Táchira':'Táchira','Mérida':'Mérida','Barinas':'Barinas','Lara':'Lara',
  'Portuguesa':'Portuguesa','Cojedes':'Cojedes','Yaracuy':'Yaracuy','Falcón':'Falcón',
  'Trujillo':'Trujillo','Sucre':'Sucre','Monagas':'Monagas','Anzoátegui':'Anzoátegui',
  'Bolívar':'Bolívar','Amazonas':'Amazonas','Delta Amacuro':'Delta Amacuro','Apure':'Apure','Guárico':'Guárico',
}

function extractCityState(direccion: string): { ciudad: string; estado: string } {
  const parts = direccion.split(',').map(p => p.trim())
  let estado = ''
  let ciudad = ''
  for (const part of parts) {
    for (const [key, val] of Object.entries(ESTADOS_MAP)) {
      if (part.includes(key)) { estado = val; break }
    }
  }
  for (const part of parts) {
    if (part && !ESTADOS_MAP[part] && !/^\d{4,}$/.test(part) && !/^Venezuela$/i.test(part) && !/^[A-Z0-9]{4}\+[A-Z0-9]+$/i.test(part)) {
      if (!ciudad) { ciudad = part; break }
    }
  }
  if (!ciudad) {
    for (const part of parts) {
      if (part && part !== estado && !/^Venezuela$/i.test(part)) { ciudad = part; break }
    }
  }
  return { ciudad: ciudad || 'Venezuela', estado: estado || 'Venezuela' }
}

function cleanAmenidades(amenidades: string[]): string[] {
  const valid: string[] = []
  const seen = new Set<string>()
  for (const item of amenidades) {
    if (isNoise(item)) continue
    const mapped = AMENITY_MAP[item]
    if (mapped && !seen.has(mapped)) { valid.push(mapped); seen.add(mapped) }
  }
  return valid
}

function cuid(): string {
  return `c${Date.now().toString(36)}${randomUUID().replace(/-/g, '').slice(0, 18)}`
}

interface ScrapedImg { url: string; alt: string | null; orden: number; esPrincipal: boolean }
interface ScrapedProp {
  titulo: string; descripcion: string; tipoPropiedad: string;
  precioPorNoche: number | null; precioOriginal: string; moneda: string;
  capacidadMaxima: number; habitaciones: number | null; banos: number | null;
  camas: number | null; direccion: string; horarioCheckIn: string;
  horarioCheckOut: string; estanciaMinima: number; estanciaMaxima: number;
  amenidades: string[]; imagenes: ScrapedImg[]
}

async function sbFetch(table: string, method: string, body?: any, query?: string): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${res.status}: ${err}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function main() {
  console.log('🚀 Iniciando importación de propiedades via Supabase REST API...\n')

  const amenRows = await sbFetch('amenidades', 'GET', undefined, 'select=id,nombre')
  const amenMap = new Map<string, string>()
  for (const r of amenRows) amenMap.set(r.nombre, r.id)
  console.log(`📦 Amenidades: ${amenMap.size}\n`)

  await sbFetch('usuarios', 'PATCH', { plan_suscripcion: 'ULTRA', rol: 'ANFITRION' }, `id=eq.${OWNER_ID}`)
  console.log('✅ Usuario actualizado a ULTRA/ANFITRION\n')

  const existing = await sbFetch('propiedades', 'GET', undefined, 'select=titulo,direccion&propietario_id=eq.' + OWNER_ID)
  const existingSet = new Set(existing.map((r: any) => `${r.titulo}|||${r.direccion}`))
  console.log(`📦 Propiedades existentes del usuario: ${existingSet.size}\n`)

  const folders = fs.readdirSync(PROPERTIES_DIR).filter(f =>
    fs.statSync(path.join(PROPERTIES_DIR, f)).isDirectory()
  )
  console.log(`📂 Carpetas: ${folders.length}\n`)

  let created = 0, skipped = 0, errors = 0

  for (const folder of folders) {
    const dataPath = path.join(PROPERTIES_DIR, folder, 'data.json')
    if (!fs.existsSync(dataPath)) { skipped++; continue }

    try {
      const data: ScrapedProp = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

      let precio = extractPrice(data.precioPorNoche, data.precioOriginal, data.descripcion, data.amenidades || [])
      if (precio <= 0) { precio = 50 }

      if (existingSet.has(`${data.titulo}|||${data.direccion}`)) { skipped++; continue }

      const tipo = mapTipo(data.tipoPropiedad || '')
      const { ciudad, estado } = extractCityState(data.direccion || '')
      const desc = (data.descripcion || '').split('\n')[0].replace(/\.\.\..*$/, '.').replace(/Mostrar más.*$/s, '').trim()

      const propId = cuid()
      await sbFetch('propiedades', 'POST', {
        id: propId,
        titulo: data.titulo,
        descripcion: desc || data.titulo,
        tipo_propiedad: tipo,
        precio_por_noche: precio,
        moneda: data.moneda === 'VES' ? 'VES' : 'USD',
        capacidad_maxima: data.capacidadMaxima || 1,
        habitaciones: (data.habitaciones && data.habitaciones > 0) ? data.habitaciones : 1,
        banos: (data.banos && data.banos > 0) ? data.banos : 1,
        camas: (data.camas && data.camas > 0) ? data.camas : 1,
        direccion: data.direccion || 'Venezuela',
        ciudad,
        estado,
        horario_checkin: data.horarioCheckIn || '15:00',
        horario_checkout: data.horarioCheckOut || '11:00',
        estancia_minima: data.estanciaMinima || 1,
        estancia_maxima: data.estanciaMaxima || 365,
        estado_publicacion: 'PUBLICADA',
        propietario_id: OWNER_ID,
        fecha_publicacion: new Date().toISOString(),
      })

      const imgs = (data.imagenes || []).filter((img) => img.url && !img.url.includes('undefined'))
      if (imgs.length > 0) {
        await sbFetch('imagenes_propiedad', 'POST', imgs.map((img, idx) => ({
          id: cuid(),
          url: img.url,
          alt: img.alt || data.titulo,
          categoria: 'otro',
          orden: idx,
          es_principal: idx === 0,
          propiedad_id: propId,
        })))
      }

      const cleaned = cleanAmenidades(data.amenidades || [])
      const links = cleaned.map(n => amenMap.get(n)).filter(Boolean).map(aid => ({
        propiedad_id: propId,
        amenidad_id: aid,
      }))
      if (links.length > 0) {
        await sbFetch('propiedad_amenidades', 'POST', links)
      }

      existingSet.add(`${data.titulo}|||${data.direccion}`)
      created++
      console.log(`✅ [${created}] ${data.titulo} — $${precio} — ${ciudad}, ${estado} — ${imgs.length} imgs — ${links.length} amen`)
    } catch (err: any) {
      errors++
      console.error(`❌ ${folder}: ${err.message.slice(0, 120)}`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 Creadas: ${created} | Omitidas: ${skipped} | Errores: ${errors} | Total: ${folders.length}`)
  console.log(`${'='.repeat(60)}`)
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1) })
