import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface LocationSuggestion {
  id: string
  nombre: string
  detalle: string
  tipo: string
  lat: number
  lng: number
}

const PHOTON_TIPOS: Record<string, string> = {
  city: 'Ciudad',
  town: 'Ciudad',
  village: 'Pueblo',
  suburb: 'Zona',
  district: 'Zona',
  neighbourhood: 'Barrio',
  quarter: 'Barrio',
  locality: 'Localidad',
  county: 'Municipio',
  state: 'Estado',
  island: 'Isla',
  country: 'País',
}

const PHOTON_KEYS_VALIDOS = new Set([
  'place',
  'boundary',
  'tourism',
])

const PHOTON_VALUES_INVALIDOS = new Set([
  'motorway_junction',
  'motorway_link',
  'residential',
  'park',
  'hotel',
  'restaurant',
  'marketplace',
  'house',
  'yes',
  'secondary',
  'tertiary',
  'primary',
  'trunk',
  'unclassified',
  'service',
  'footway',
  'pedestrian',
])

const NOMINATIM_TIPOS: Record<string, string> = {
  city: 'Ciudad',
  town: 'Ciudad',
  village: 'Pueblo',
  suburb: 'Zona',
  neighbourhood: 'Barrio',
  quarter: 'Barrio',
  locality: 'Localidad',
  state: 'Estado',
  residential: 'Zona residencial',
  island: 'Isla',
  tourism: 'Destino turístico',
}

const VENEZUELA_CENTER = { lat: 10.5, lon: -66.9 }

function normalizePhotonFeature(f: {
  properties: Record<string, string | undefined>
  geometry: { coordinates: number[] }
}): LocationSuggestion | null {
  const p = f.properties
  const coords = f.geometry.coordinates
  if (!coords || coords.length < 2) return null

  const osmKey = p.osm_key ?? ''
  const osmValue = p.osm_value ?? ''

  if (PHOTON_VALUES_INVALIDOS.has(osmValue)) return null
  if (!PHOTON_KEYS_VALIDOS.has(osmKey) && osmKey !== 'place' && osmKey !== 'boundary') {
    if (osmKey === 'highway' || osmKey === 'amenity' || osmKey === 'landuse' || osmKey === 'leisure' || osmKey === 'building') return null
  }

  const tipo = PHOTON_TIPOS[osmValue] ?? (osmKey === 'place' ? 'Lugar' : osmKey === 'boundary' ? 'Zona' : null)
  if (!tipo) return null

  const nombre = p.name ?? ''
  if (!nombre) return null

  const detalle: string[] = []
  if (p.district && p.district !== nombre) detalle.push(p.district)
  if (p.city && p.city !== nombre && !detalle.includes(p.city)) detalle.push(p.city)
  if (p.county && p.county !== nombre && !detalle.includes(p.county)) detalle.push(p.county)
  if (p.state && !detalle.some(d => d.includes(p.state ?? ''))) detalle.push(p.state)

  return {
    id: `ph-${p.osm_id ?? nombre}`,
    nombre,
    detalle: detalle.join(', '),
    tipo,
    lat: coords[1],
    lng: coords[0],
  }
}

async function searchPhoton(q: string): Promise<LocationSuggestion[]> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '10')
  url.searchParams.set('lat', String(VENEZUELA_CENTER.lat))
  url.searchParams.set('lon', String(VENEZUELA_CENTER.lon))
  url.searchParams.set('bbox', '-73.5,0.5,-59,13')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Boogie/1.0 (contacto@boogie.com.ve)' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Photon ${res.status}`)

  const data = await res.json()
  const features: unknown[] = data.features ?? []

  const seen = new Set<string>()
  const resultados: LocationSuggestion[] = []

  for (const raw of features) {
    const f = raw as { properties: Record<string, string | undefined>; geometry: { coordinates: number[] } }
    if (f.properties?.countrycode !== 'VE') continue
    const r = normalizePhotonFeature(f)
    if (!r) continue
    const key = `${r.nombre}-${r.lat.toFixed(2)}-${r.lng.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    resultados.push(r)
    if (resultados.length >= 8) break
  }

  return resultados
}

async function searchNominatim(q: string): Promise<LocationSuggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('countrycodes', 've')
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '8')
  url.searchParams.set('accept-language', 'es')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Boogie/1.0 (contacto@boogie.com.ve)' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)

  const data: {
    place_id: number
    display_name: string
    lat: string
    lon: string
    type: string
    class: string
    address?: Record<string, string>
  }[] = await res.json()

  const seen = new Set<string>()
  const resultados: LocationSuggestion[] = []

  for (const item of data) {
    const typeKey = item.type || item.class
    const tipo = NOMINATIM_TIPOS[typeKey]
    if (!tipo && item.class !== 'place' && item.class !== 'boundary') continue

    const addr = item.address ?? {}
    const parts = item.display_name.split(',').map((s) => s.trim())
    const nombre = parts[0]
    if (!nombre) continue

    const resolvedTipo = tipo ?? (item.class === 'place' ? 'Lugar' : 'Zona')

    const detalle: string[] = []
    if (addr.suburb && nombre !== addr.suburb) detalle.push(addr.suburb)
    if (addr.city && nombre !== addr.city && !detalle.includes(addr.city)) detalle.push(addr.city)
    else if (addr.town && nombre !== addr.town) detalle.push(addr.town)
    else if (addr.village && nombre !== addr.village) detalle.push(addr.village)
    if (addr.state && !detalle.some(d => d.includes(addr.state))) detalle.push(addr.state)

    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    const key = `${nombre}-${lat.toFixed(2)}-${lng.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)

    resultados.push({
      id: `nom-${item.place_id}`,
      nombre,
      detalle: detalle.join(', '),
      tipo: resolvedTipo,
      lat,
      lng,
    })
  }

  return resultados
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ resultados: [] })
  }

  try {
    let resultados = await searchPhoton(q)

    if (resultados.length === 0) {
      resultados = await searchNominatim(q)
    }

    return NextResponse.json({ resultados })
  } catch (error) {
    console.error('Ubicaciones API error:', error)
    return NextResponse.json({ resultados: [] })
  }
}
