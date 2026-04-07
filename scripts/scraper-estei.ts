/**
 * Scraper mejorado para estei.app
 * Extrae datos de las tarjetas de propiedades en las páginas de búsqueda
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium, Browser, Page } from 'playwright'

const OUTPUT_DIR = path.join(process.cwd(), 'infoScrapeada')

interface PropertyData {
  id: string
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
  latitud: number | null
  longitud: number | null
  reglas: string | null
  politicaCancelacion: string
  horarioCheckIn: string
  horarioCheckOut: string
  estanciaMinima: number
  estanciaMaxima: number | null
  estadoPublicacion: string
  imagenes: {
    url: string
    alt: string | null
    orden: number
    esPrincipal: boolean
  }[]
  amenidades: string[]
  fuenteScraping: {
    sitio: string
    urlOriginal: string
    fechaScraping: string
    precioOriginal?: string
  }
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function scrapeSearchPage(page: Page, url: string): Promise<PropertyData[]> {
  console.log(`\n🔍 Scraping página de búsqueda: ${url.substring(0, 60)}...`)
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)
  
  // Extraer datos de las tarjetas usando page.evaluate
  const cardsData = await page.evaluate(() => {
    const cards: any[] = []
    
    // Buscar todas las tarjetas con data-testid="stay-card"
    const stayCards = document.querySelectorAll('[data-testid="stay-card"]')
    
    stayCards.forEach((card, index) => {
      const cardData: any = {
        index,
        fuenteScraping: {
          sitio: 'estei.app',
          urlOriginal: window.location.href,
          fechaScraping: new Date().toISOString(),
        }
      }
      
      // Extraer link al perfil
      const link = card.querySelector('a')
      cardData.profileUrl = link?.href || null
      
      // Extraer toda la información visible en la tarjeta
      cardData.texto = card.textContent?.trim().substring(0, 500) || ''
      cardData.htmlContent = card.innerHTML.substring(0, 1000)
      
      // Buscar imágenes
      const imgs = Array.from(card.querySelectorAll('img'))
        .filter(img => {
          const src = img.src || ''
          return src.startsWith('http') && !src.includes('data:') && !src.includes('googleapis.com')
        })
        .slice(0, 5)
        .map((img, idx) => ({
          url: img.src,
          alt: img.alt || null,
          orden: idx + 1,
          esPrincipal: idx === 0
        }))
      cardData.imagenes = imgs
      
      // Buscar precio
      const priceMatch = card.textContent?.match(/\$[\d,]+(?:\.\d{2})?/)
      if (priceMatch) {
        cardData.precioTexto = priceMatch[0]
      }
      
      // Buscar ubicación
      const locationMatch = card.textContent?.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*(?:Distrito\sCapital|Venezuela|[A-Z][a-z]+))/)
      if (locationMatch) {
        cardData.ubicacion = locationMatch[1]
      }
      
      // Buscar número de habitaciones, baños, etc
      const roomsMatch = card.textContent?.match(/(\d+)\s*(?:hab|habitaci)/i)
      if (roomsMatch) cardData.habitaciones = parseInt(roomsMatch[1])
      
      const bathsMatch = card.textContent?.match(/(\d+)\s*(?:baño|bath)/i)
      if (bathsMatch) cardData.banos = parseInt(bathsMatch[1])
      
      const guestsMatch = card.textContent?.match(/(\d+)\s*(?:huésped|guest)/i)
      if (guestsMatch) cardData.capacidadMaxima = parseInt(guestsMatch[1])
      
      cards.push(cardData)
    })
    
    return cards
  })
  
  console.log(`  ✅ Encontradas ${cardsData.length} tarjetas`)
  return cardsData as PropertyData[]
}

function parseCardToProperty(card: any): PropertyData {
  const property: PropertyData = {
    id: `estei_${Date.now()}_${card.index}`,
    titulo: 'Sin título',
    descripcion: card.texto || 'Propiedad scrapeada de estei.app',
    tipoPropiedad: 'APARTAMENTO',
    precioPorNoche: 50,
    moneda: 'USD',
    capacidadMaxima: 2,
    habitaciones: 1,
    banos: 1,
    camas: 1,
    direccion: '',
    ciudad: 'Venezuela',
    estado: 'Distrito Capital',
    zona: null,
    latitud: null,
    longitud: null,
    reglas: null,
    politicaCancelacion: 'MODERADA',
    horarioCheckIn: '15:00',
    horarioCheckOut: '11:00',
    estanciaMinima: 1,
    estanciaMaxima: 30,
    estadoPublicacion: 'PUBLICADA',
    imagenes: card.imagenes || [],
    amenidades: ['wifi', 'aire_acondicionado'],
    fuenteScraping: {
      sitio: 'estei.app',
      urlOriginal: card.profileUrl || 'https://estei.app',
      fechaScraping: new Date().toISOString()
    }
  }
  
  // Parsear título del alt de la imagen principal
  if (card.imagenes && card.imagenes.length > 0) {
    const mainImgAlt = card.imagenes[0].alt
    if (mainImgAlt && mainImgAlt !== 'null') {
      // Convertir slug a título: "novo-hotel-0" -> "Novo Hotel"
      property.titulo = mainImgAlt
        .replace(/-/g, ' ')
        .replace(/\s*\d+$/, '')  // Remover número final
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim()
    }
  }
  
  // Parsear ubicación del texto
  if (card.ubicacion) {
    const parts = card.ubicacion.split(',').map((s: string) => s.trim())
    property.ciudad = parts[0] || 'Venezuela'
    property.estado = parts[1] || 'Distrito Capital'
    property.direccion = card.ubicacion
  }
  
  // Parsear precio
  if (card.precioTexto) {
    const priceNum = card.precioTexto.replace(/[$,]/g, '')
    property.precioPorNoche = parseFloat(priceNum) || 50
  }
  
  // Parsear características
  if (card.habitaciones) property.habitaciones = card.habitaciones
  if (card.banos) property.banos = card.banos
  if (card.capacidadMaxima) property.capacidadMaxima = card.capacidadMaxima
  
  // Estimar tipo de propiedad por el texto
  const textoLower = card.texto?.toLowerCase() || ''
  if (textoLower.includes('casa')) property.tipoPropiedad = 'CASA'
  else if (textoLower.includes('villa')) property.tipoPropiedad = 'VILLA'
  else if (textoLower.includes('cabaña')) property.tipoPropiedad = 'CABANA'
  else if (textoLower.includes('penthouse')) property.tipoPropiedad = 'PENTHOUSE'
  else if (textoLower.includes('loft')) property.tipoPropiedad = 'LOFT'
  else if (textoLower.includes('finca')) property.tipoPropiedad = 'FINCA'
  else if (textoLower.includes('estudio')) property.tipoPropiedad = 'ESTUDIO'
  else if (textoLower.includes('habitación') || textoLower.includes('habitacion')) property.tipoPropiedad = 'HABITACION'
  
  return property
}

async function scrapeAllPages() {
  console.log('='.repeat(60))
  console.log('🚀 SCRAPER MEJORADO PARA estei.app')
  console.log('='.repeat(60))
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()
  
  const allProperties: PropertyData[] = []
  
  try {
    // URLs de búsqueda por ubicación
    const searchUrls = [
      'https://estei.app/search?search_text=Caracas&lat=10.4806&lng=-66.9036&zoom=12&guests=1',
      'https://estei.app/search?search_text=Margarita&lat=10.9364021&lng=-64.0989243&zoom=10&guests=1',
      'https://estei.app/search?search_text=La+Guaira&lat=10.601&lng=-66.9699&zoom=12&guests=1',
    ]
    
    for (const url of searchUrls) {
      const cards = await scrapeSearchPage(page, url)
      
      for (const card of cards) {
        const property = parseCardToProperty(card)
        allProperties.push(property)
      }
      
      await page.waitForTimeout(2000)
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 RESUMEN: ${allProperties.length} propiedades encontradas`)
    console.log('='.repeat(60))
    
    // Mostrar algunas propiedades
    allProperties.slice(0, 5).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.titulo}`)
      console.log(`   📍 ${p.ciudad}, ${p.estado}`)
      console.log(`   💰 $${p.precioPorNoche} ${p.moneda}`)
      console.log(`   🛏️ ${p.habitaciones} hab, ${p.banos} baños`)
      console.log(`   📷 ${p.imagenes.length} imágenes`)
    })
    
    // Guardar archivos individuales
    console.log(`\n${'='.repeat(60)}`)
    console.log('💾 GUARDANDO ARCHIVOS')
    console.log('='.repeat(60))
    
    for (const property of allProperties) {
      const filename = `inmueble_${property.id}.json`
      const filepath = path.join(OUTPUT_DIR, filename)
      fs.writeFileSync(filepath, JSON.stringify(property, null, 2))
      console.log(`  ✅ ${filename}`)
    }
    
    // Guardar archivo combinado
    const combinedPath = path.join(OUTPUT_DIR, 'inmuebles_estei.json')
    fs.writeFileSync(combinedPath, JSON.stringify(allProperties, null, 2))
    console.log(`\n  📁 Combined: ${combinedPath}`)
    
    console.log(`\n✨ Scraping completado! ${allProperties.length} propiedades guardadas en ${OUTPUT_DIR}`)
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

// Ejecutar
scrapeAllPages()
