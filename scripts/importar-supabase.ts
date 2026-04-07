/**
 * Script de importacion usando Supabase SDK
 * Alternativo cuando Prisma directo no funciona
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY son requeridos')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ImagenScraping {
  url: string
  alt: string | null
  orden: number
  esPrincipal: boolean
}

interface InmuebleScraping {
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
  imagenes: ImagenScraping[]
  amenidades: string[]
}

const TIPOS_VALIDOS: Record<string, string> = {
  APARTAMENTO: 'APARTAMENTO',
  CASA: 'CASA',
  VILLA: 'VILLA',
  CABANA: 'CABANA',
  ESTUDIO: 'ESTUDIO',
  HABITACION: 'HABITACION',
  LOFT: 'LOFT',
  PENTHOUSE: 'PENTHOUSE',
  FINCA: 'FINCA',
  OTRO: 'OTRO',
}

const POLITICAS_VALIDAS: Record<string, string> = {
  FLEXIBLE: 'FLEXIBLE',
  MODERADA: 'MODERADA',
  ESTRICTA: 'ESTRICTA',
}

const ESTADOS_VALIDOS: Record<string, string> = {
  BORRADOR: 'BORRADOR',
  PUBLICADA: 'PUBLICADA',
  PAUSADA: 'PAUSADA',
}

function normalizarInmueble(inmueble: InmuebleScraping) {
  let titulo = inmueble.titulo
  if (titulo === 'Sin titulo' || titulo === 'Sin título') {
    titulo = `Propiedad en ${inmueble.estado || 'Venezuela'}`
  }

  const tipoPropiedad = TIPOS_VALIDOS[inmueble.tipoPropiedad] || 'OTRO'
  const moneda = inmueble.moneda || 'USD'
  const politica = POLITICAS_VALIDAS[inmueble.politicaCancelacion] || 'MODERADA'
  const estadoPublicacion = ESTADOS_VALIDOS[inmueble.estadoPublicacion] || 'BORRADOR'

  const capacidadMaxima = inmueble.capacidadMaxima > 0 ? inmueble.capacidadMaxima : 2
  const habitaciones = inmueble.habitaciones > 0 ? inmueble.habitaciones : 1
  const banos = inmueble.banos > 0 ? inmueble.banos : 1
  const camas = inmueble.camas > 0 ? inmueble.camas : 1

  let direccion = inmueble.direccion
  if (!direccion || direccion.trim() === '') {
    direccion = `${inmueble.ciudad || 'Ciudad'}, ${inmueble.estado || 'Estado'}, Venezuela`
  }

  let ciudad = inmueble.ciudad
  if (ciudad === 'Venezuela' || !ciudad) {
    ciudad = inmueble.estado === 'Distrito Capital' ? 'Caracas' : 'Por confirmar'
  }

  const amenidadesNormalizadas = inmueble.amenidades.map(a => {
    return a.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })

  return {
    ...inmueble,
    titulo,
    tipoPropiedad,
    moneda,
    politica,
    estadoPublicacion,
    capacidadMaxima,
    habitaciones,
    banos,
    camas,
    direccion,
    ciudad,
    amenidades: amenidadesNormalizadas,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  let scrapDir = path.join(process.cwd(), 'infoScrapeada')

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--path' || args[i].startsWith('--path=')) && args[i + 1]) {
      scrapDir = args[i].startsWith('--path=') ? args[i].split('=')[1] : args[i + 1]
    }
    if (args[i] === '--help') {
      console.log('Uso: npx tsx scripts/importar-supabase.ts [opciones]')
      console.log('Opciones:')
      console.log('  --path <ruta>    Directorio con archivos JSON')
      console.log('  --dry-run        Solo validar sin importar')
      console.log('  --help           Mostrar esta ayuda')
      process.exit(0)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('IMPORTADOR DE INMUEBLES (SUPABASE SDK)')
  console.log(`${'='.repeat(60)}`)
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Directorio: ${scrapDir}`)
  console.log(`Modo: ${dryRun ? 'DRY RUN (solo validacion)' : 'IMPORTAR'}\n`)

  if (!fs.existsSync(scrapDir)) {
    console.error(`Directorio no encontrado: ${scrapDir}`)
    process.exit(1)
  }

  const archivos = fs.readdirSync(scrapDir).filter(f => f.endsWith('.json'))
  
  if (archivos.length === 0) {
    console.error('No se encontraron archivos JSON')
    process.exit(1)
  }

  console.log(`Encontrados ${archivos.length} archivo(s)\n`)

  if (dryRun) {
    console.log('[DRY RUN] Verificando archivos...\n')
  }

  let propietarioId: string | null = null

  if (!dryRun) {
    const { data: existingUser, error: userError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('rol', 'ADMIN')
      .limit(1)
      .single()

    if (existingUser) {
      propietarioId = existingUser.id
      console.log(`Usando propietario: ${existingUser.email}\n`)
    } else {
      const { data: anyUser, error: anyUserError } = await supabase
        .from('usuarios')
        .select('id, email')
        .limit(1)
        .single()

      if (anyUser) {
        propietarioId = anyUser.id
        console.log(`Usando usuario existente: ${anyUser.email}\n`)
      } else {
        console.error('No hay usuarios en la base de datos')
        console.log('Primero registra un usuario en la aplicacion')
        process.exit(1)
      }
    }
  }

  const resultados: { id: string; archivo: string; exito: boolean; mensaje: string }[] = []

  for (const archivo of archivos) {
    if (archivo.includes('debug') || archivo.includes('plantilla')) {
      console.log(`Saltando: ${archivo}`)
      continue
    }

    const rutaArchivo = path.join(scrapDir, archivo)
    console.log(`Procesando: ${archivo}`)

    try {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8')
      const data = JSON.parse(contenido)
      const inmuebles: InmuebleScraping[] = Array.isArray(data) ? data : [data]

      for (const inmueble of inmuebles) {
        const datos = normalizarInmueble(inmueble)

        if (dryRun) {
          console.log(`  OK - [DRY RUN] Se importaria: ${datos.titulo}`)
          resultados.push({ id: inmueble.id, archivo, exito: true, mensaje: 'Validado' })
          continue
        }

        const propiedadData = {
          id: datos.id,
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          tipo_propiedad: datos.tipoPropiedad,
          precio_por_noche: datos.precioPorNoche,
          moneda: datos.moneda,
          capacidad_maxima: datos.capacidadMaxima,
          habitaciones: datos.habitaciones,
          banos: datos.banos,
          camas: datos.camas,
          direccion: datos.direccion,
          ciudad: datos.ciudad,
          estado: datos.estado,
          zona: datos.zona,
          latitud: datos.latitud,
          longitud: datos.longitud,
          reglas: datos.reglas,
          politica_cancelacion: datos.politica,
          horario_checkin: datos.horarioCheckIn,
          horario_checkout: datos.horarioCheckOut,
          estancia_minima: datos.estanciaMinima,
          estancia_maxima: datos.estanciaMaxima,
          estado_publicacion: datos.estadoPublicacion,
          propietario_id: propietarioId,
          fecha_publicacion: datos.estadoPublicacion === 'PUBLICADA' ? new Date().toISOString() : null,
          destacada: false,
          total_resenas: 0,
          vistas_totales: 0,
        }

        const { data: propiedad, error: propError } = await supabase
          .from('propiedades')
          .insert(propiedadData)
          .select()
          .single()

        if (propError) {
          if (propError.code === '23505') {
            console.log(`  SKIP - Propiedad ya existe: ${datos.titulo}`)
            resultados.push({ id: inmueble.id, archivo, exito: true, mensaje: 'Ya existe' })
            continue
          }
          console.log(`  ERROR - ${propError.message}`)
          resultados.push({ id: inmueble.id, archivo, exito: false, mensaje: propError.message })
          continue
        }

        for (const img of datos.imagenes) {
          await supabase.from('imagenes_propiedad').insert({
            url: img.url,
            alt: img.alt,
            orden: img.orden,
            es_principal: img.esPrincipal,
            propiedad_id: propiedad.id,
          })
        }

        for (const amenidadNombre of datos.amenidades) {
          const { data: amenidad } = await supabase
            .from('amenidades')
            .select('id')
            .eq('nombre', amenidadNombre)
            .single()

          let amenidadId = amenidad?.id

          if (!amenidadId) {
            const { data: nuevaAmenidad } = await supabase
              .from('amenidades')
              .insert({ nombre: amenidadNombre, categoria: 'COMODIDADES' })
              .select()
              .single()
            amenidadId = nuevaAmenidad?.id
          }

          if (amenidadId) {
            await supabase.from('propiedad_amenidades').insert({
              propiedad_id: propiedad.id,
              amenidad_id: amenidadId,
            })
          }
        }

        console.log(`  OK - ${datos.titulo}`)
        resultados.push({ id: inmueble.id, archivo, exito: true, mensaje: 'Importado' })
      }
    } catch (error: any) {
      console.error(`  Error: ${error.message}`)
      resultados.push({ id: archivo, archivo, exito: false, mensaje: error.message })
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('RESUMEN')
  console.log('='.repeat(60))
  
  const exitosos = resultados.filter(r => r.exito).length
  const fallidos = resultados.filter(r => !r.exito).length
  
  console.log(`Exitosos: ${exitosos}`)
  console.log(`Fallidos: ${fallidos}`)
  console.log(`Total: ${resultados.length}`)

  if (dryRun) {
    console.log('\n[DRY RUN] No se realizo ningun cambio en la base de datos')
  }

  console.log('\nCompletado!')
}

main().catch(console.error)