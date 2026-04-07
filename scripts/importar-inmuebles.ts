/**
 * Script de importacion con validacion y formateo de datos
 * 
 * Uso:
 * npx tsx scripts/importar-inmuebles.ts                    # Importar todos los JSON
 * npx tsx scripts/importar-inmuebles.ts --dry-run          # Solo validar, no importar
 * npx tsx scripts/importar-inmuebles.ts --path=./data     # Usar ruta especifica
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { TipoPropiedad, Moneda, PoliticaCancelacion, EstadoPublicacion } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface ImagenScraping {
  url: string
  alt: string | null
  orden: number
  esPrincipal: boolean
}

interface FuenteScraping {
  sitio: string
  urlOriginal: string
  fechaScraping: string
  precioOriginal?: string
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
  fuenteScraping: FuenteScraping | null
}

interface ResultadoValidacion {
  valido: boolean
  errores: string[]
  advertencias: string[]
  datosNormalizados?: InmuebleNormalizado
}

interface InmuebleNormalizado {
  id: string
  titulo: string
  descripcion: string
  tipoPropiedad: TipoPropiedad
  precioPorNoche: number
  moneda: Moneda
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
  politicaCancelacion: PoliticaCancelacion
  horarioCheckIn: string
  horarioCheckOut: string
  estanciaMinima: number
  estanciaMaxima: number | null
  estadoPublicacion: EstadoPublicacion
  imagenes: ImagenScraping[]
  amenidades: string[]
}

const TIPOS_VALIDOS: Record<string, TipoPropiedad> = {
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

const POLITICAS_VALIDAS: Record<string, PoliticaCancelacion> = {
  FLEXIBLE: 'FLEXIBLE',
  MODERADA: 'MODERADA',
  ESTRICTA: 'ESTRICTA',
}

const ESTADOS_VALIDOS: Record<string, EstadoPublicacion> = {
  BORRADOR: 'BORRADOR',
  PUBLICADA: 'PUBLICADA',
  PAUSADA: 'PAUSADA',
}

const ESTADOS_VENEZUELA = [
  'Amazonas', 'Anzoategui', 'Apure', 'Aragua', 'Barinas', 'Bolivar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcon', 'Guarico', 'Lara',
  'Merida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Tachira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia', 'La Guaira'
]

const CIUDADES_POR_ESTADO: Record<string, string[]> = {
  'Distrito Capital': ['Caracas'],
  'Miranda': ['Los Teques', 'Guatire', 'Guarenas', 'Charallave', 'Petare', 'Baruta', 'El Hatillo'],
  'La Guaira': ['La Guaira', 'Catia La Mar', 'Maiquetia', 'Caraballeda', 'Vargas'],
  'Nueva Esparta': ['Porlamar', 'Pampatar', 'La Asuncion', 'Juan Griego'],
  'Carabobo': ['Valencia', 'Puerto Cabello', 'Mariara', 'Guacara'],
  'Aragua': ['Maracay', 'La Victoria', 'Turmero', 'Barqui'],
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function extraerCapacidad(descripcion: string): number | null {
  const match = descripcion.match(/hasta\s+(\d+)\s+(?:viajeros|personas)/i)
  if (match) return parseInt(match[1], 10)
  
  const match2 = descripcion.match(/(\d+)\s+(?:viajeros|personas)/i)
  if (match2) return parseInt(match2[1], 10)
  
  return null
}

function extraerUbicacion(descripcion: string): { estado: string | null; ciudad: string | null } {
  const estadoMatch = ESTADOS_VENEZUELA.find(e => {
    const estadoNormalizado = normalizarTexto(e)
    return normalizarTexto(descripcion).includes(estadoNormalizado)
  })

  let estado: string | null = estadoMatch || null
  
  if (!estado) {
    const altEstadoMatch = descripcion.match(/Apartamento\s+(\w+)/i)
    if (altEstadoMatch && ESTADOS_VENEZUELA.map(e => normalizarTexto(e)).includes(normalizarTexto(altEstadoMatch[1]))) {
      estado = ESTADOS_VENEZUELA.find(e => normalizarTexto(e) === normalizarTexto(altEstadoMatch[1])) || null
    }
  }

  let ciudad: string | null = null
  
  if (estado && CIUDADES_POR_ESTADO[estado]) {
    for (const c of CIUDADES_POR_ESTADO[estado]) {
      if (normalizarTexto(descripcion).includes(normalizarTexto(c))) {
        ciudad = c
        break
      }
    }
    
    if (!ciudad && estado === 'Distrito Capital') {
      ciudad = 'Caracas'
    }
  }

  return { estado, ciudad }
}

function generarDireccionFalsa(ciudad: string, estado: string): string {
  const calles = ['Principal', 'Bolivar', 'Libertador', 'Sucre', 'Miranda', 'Padre Sierra']
  const calle = calles[Math.floor(Math.random() * calles.length)]
  const numero = Math.floor(Math.random() * 100) + 1
  return `${calle}, No. ${numero}, ${ciudad}, ${estado}, Venezuela`
}

function validarPrecio(precio: number): { valido: boolean; advertencia?: string } {
  if (precio <= 0) return { valido: false, advertencia: 'El precio debe ser mayor a 0' }
  if (precio < 10) return { valido: true, advertencia: 'El precio parece muy bajo, verificar' }
  if (precio > 1000) return { valido: true, advertencia: 'El precio parece muy alto, verificar' }
  return { valido: true }
}

function validarInmueble(inmueble: InmuebleScraping): ResultadoValidacion {
  const errores: string[] = []
  const advertencias: string[] = []

  if (!inmueble.id || inmueble.id.trim() === '') {
    errores.push('ID es requerido')
  }

  if (!inmueble.titulo || inmueble.titulo.trim() === '' || inmueble.titulo === 'Sin titulo') {
    errores.push('Titulo invalido o vacio')
  }

  if (!inmueble.descripcion || inmueble.descripcion.trim() === '') {
    errores.push('Descripcion es requerida')
  }

  const tipoPropiedad = TIPOS_VALIDOS[inmueble.tipoPropiedad as TipoPropiedad]
  if (!tipoPropiedad) {
    errores.push(`Tipo de propiedad invalido: ${inmueble.tipoPropiedad}`)
  }

  const validacionPrecio = validarPrecio(inmueble.precioPorNoche)
  if (!validacionPrecio.valido) {
    errores.push(validacionPrecio.advertencia!)
  } else if (validacionPrecio.advertencia) {
    advertencias.push(validacionPrecio.advertencia)
  }

  const moneda = inmueble.moneda as Moneda
  if (!['USD', 'VES'].includes(moneda)) {
    errores.push(`Moneda invalida: ${inmueble.moneda}`)
  }

  if (inmueble.capacidadMaxima <= 0) {
    errores.push('La capacidad maxima debe ser mayor a 0')
  }

  if (inmueble.habitaciones <= 0) {
    errores.push('El numero de habitaciones debe ser mayor a 0')
  }

  if (inmueble.banos <= 0) {
    errores.push('El numero de banos debe ser mayor a 0')
  }

  if (inmueble.horarioCheckIn && !/^\d{2}:\d{2}$/.test(inmueble.horarioCheckIn)) {
    errores.push(`Formato de horario de check-in invalido: ${inmueble.horarioCheckIn}`)
  }

  if (inmueble.horarioCheckOut && !/^\d{2}:\d{2}$/.test(inmueble.horarioCheckOut)) {
    errores.push(`Formato de horario de check-out invalido: ${inmueble.horarioCheckOut}`)
  }

  if (inmueble.estanciaMinima <= 0) {
    errores.push('La estancia minima debe ser mayor a 0')
  }

  if (inmueble.estanciaMaxima && inmueble.estanciaMaxima < inmueble.estanciaMinima) {
    errores.push('La estancia maxima no puede ser menor a la minima')
  }

  const politica = POLITICAS_VALIDAS[inmueble.politicaCancelacion]
  if (!politica) {
    errores.push(`Politica de cancelacion invalida: ${inmueble.politicaCancelacion}`)
  }

  const estado = ESTADOS_VALIDOS[inmueble.estadoPublicacion] || 'BORRADOR'

  if (inmueble.imagenes.length === 0) {
    advertencias.push('No tiene imagenes')
  }

  if (!inmueble.direccion || inmueble.direccion.trim() === '') {
    advertencias.push('Direccion vacia, se generara automaticamente')
  }

  if (inmueble.ciudad === 'Venezuela' || !inmueble.ciudad) {
    advertencias.push('Ciudad requiere normalizacion')
  }

  if (inmueble.estado === 'Distrito Capital' && !inmueble.descripcion.includes('Distrito Capital')) {
    advertencias.push('Estado podria estar incorrecto, verificar con descripcion')
  }

  return { valido: errores.length === 0, errores, advertencias }
}

function normalizarInmueble(inmueble: InmuebleScraping): InmuebleNormalizado {
  let titulo = inmueble.titulo
  if (titulo === 'Sin titulo' || titulo === 'Sin tiltulo') {
    titulo = `Propiedad en ${inmueble.estado || 'Venezuela'}`
  }

  const capacidadExtraida = extraerCapacidad(inmueble.descripcion)
  const capacidadMaxima = capacidadExtraida || inmueble.capacidadMaxima || 2

  const { estado: estadoExtraido, ciudad: ciudadExtraida } = extraerUbicacion(inmueble.descripcion)
  const estado = estadoExtraido || inmueble.estado || 'Distrito Capital'
  
  let ciudad = ciudadExtraida || inmueble.ciudad
  if (ciudad === 'Venezuela' || !ciudad) {
    ciudad = estado === 'Distrito Capital' ? 'Caracas' : 'Por confirmar'
  }

  let direccion = inmueble.direccion
  if (!direccion || direccion.trim() === '') {
    direccion = generarDireccionFalsa(ciudad, estado)
  }

  const tipoPropiedad = TIPOS_VALIDOS[inmueble.tipoPropiedad as TipoPropiedad] || 'OTRO'
  const moneda = (inmueble.moneda as Moneda) || 'USD'
  const politica = POLITICAS_VALIDAS[inmueble.politicaCancelacion] || 'MODERADA'
  const estadoPublicacion = ESTADOS_VALIDOS[inmueble.estadoPublicacion] || 'BORRADOR'

  const amenidadesNormalizadas = inmueble.amenidades.map(a => {
    return a
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  })

  return {
    id: inmueble.id,
    titulo,
    descripcion: inmueble.descripcion,
    tipoPropiedad,
    precioPorNoche: inmueble.precioPorNoche,
    moneda,
    capacidadMaxima,
    habitaciones: inmueble.habitaciones || 1,
    banos: inmueble.banos || 1,
    camas: inmueble.camas || 1,
    direccion,
    ciudad,
    estado,
    zona: inmueble.zona,
    latitud: inmueble.latitud,
    longitud: inmueble.longitud,
    reglas: inmueble.reglas,
    politicaCancelacion: politica,
    horarioCheckIn: inmueble.horarioCheckIn || '15:00',
    horarioCheckOut: inmueble.horarioCheckOut || '11:00',
    estanciaMinima: inmueble.estanciaMinima || 1,
    estanciaMaxima: inmueble.estanciaMaxima,
    estadoPublicacion,
    imagenes: inmueble.imagenes,
    amenidades: amenidadesNormalizadas,
  }
}

async function importarInmueble(
  inmueble: InmuebleNormalizado,
  propietarioId: string,
  dryRun: boolean
): Promise<{ exito: boolean; mensaje: string; errores?: string[] }> {
  if (dryRun) {
    return { exito: true, mensaje: `[DRY RUN] Se importaria: ${inmueble.titulo}` }
  }

  try {
    const propiedad = await prisma.propiedad.create({
      data: {
        id: inmueble.id,
        titulo: inmueble.titulo,
        descripcion: inmueble.descripcion,
        tipoPropiedad: inmueble.tipoPropiedad,
        precioPorNoche: inmueble.precioPorNoche,
        moneda: inmueble.moneda,
        capacidadMaxima: inmueble.capacidadMaxima,
        habitaciones: inmueble.habitaciones,
        banos: inmueble.banos,
        camas: inmueble.camas,
        direccion: inmueble.direccion,
        ciudad: inmueble.ciudad,
        estado: inmueble.estado,
        zona: inmueble.zona,
        latitud: inmueble.latitud,
        longitud: inmueble.longitud,
        reglas: inmueble.reglas,
        politicaCancelacion: inmueble.politicaCancelacion,
        horarioCheckIn: inmueble.horarioCheckIn,
        horarioCheckOut: inmueble.horarioCheckOut,
        estanciaMinima: inmueble.estanciaMinima,
        estanciaMaxima: inmueble.estanciaMaxima,
        estadoPublicacion: inmueble.estadoPublicacion,
        propietarioId,
        fechaPublicacion: inmueble.estadoPublicacion === 'PUBLICADA' ? new Date() : null,
        destacada: false,
        ratingPromedio: null,
        totalResenas: 0,
        vistasTotales: 0,
      },
    })

    for (const img of inmueble.imagenes) {
      await prisma.imagenPropiedad.create({
        data: {
          url: img.url,
          alt: img.alt,
          orden: img.orden,
          esPrincipal: img.esPrincipal,
          propiedadId: propiedad.id,
        },
      })
    }

    for (const amenidadNombre of inmueble.amenidades) {
      let amenidad = await prisma.amenidad.findUnique({
        where: { nombre: amenidadNombre },
      })

      if (!amenidad) {
        amenidad = await prisma.amenidad.create({
          data: {
            nombre: amenidadNombre,
            icono: null,
            categoria: 'COMODIDADES',
          },
        })
      }

      await prisma.propiedadAmenidad.create({
        data: {
          propiedadId: propiedad.id,
          amenidadId: amenidad.id,
        },
      })
    }

    return { exito: true, mensaje: `Propiedad "${inmueble.titulo}" importada correctamente` }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { exito: false, mensaje: `La propiedad con ID ${inmueble.id} ya existe` }
    }
    return { exito: false, mensaje: `Error: ${error.message}` }
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
      console.log('Uso: npx tsx scripts/importar-inmuebles.ts [opciones]')
      console.log('Opciones:')
      console.log('  --path <ruta>    Directorio con archivos JSON (default: ./infoScrapeada)')
      console.log('  --dry-run        Solo validar sin importar a la base de datos')
      console.log('  --help           Mostrar esta ayuda')
      process.exit(0)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('IMPORTADOR DE INMUEBLES CON VALIDACION')
  console.log(`${'='.repeat(60)}`)
  console.log(`Directorio: ${scrapDir}`)
  console.log(`Modo: ${dryRun ? 'DRY RUN (solo validacion)' : 'IMPORTAR'}\n`)

  if (!fs.existsSync(scrapDir)) {
    console.error(`Directorio no encontrado: ${scrapDir}`)
    process.exit(1)
  }

  const archivos = fs.readdirSync(scrapDir).filter(f => f.endsWith('.json'))
  
  if (archivos.length === 0) {
    console.error('No se encontraron archivos JSON en el directorio')
    process.exit(1)
  }

  console.log(`Encontrados ${archivos.length} archivo(s)\n`)

  let propietarioId: string | null = null

  if (!dryRun) {
    const existingUser = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' },
    })

    if (existingUser) {
      propietarioId = existingUser.id
      console.log(`Usando propietario: ${existingUser.email}\n`)
    } else {
      const anyUser = await prisma.usuario.findFirst()
      if (anyUser) {
        propietarioId = anyUser.id
        console.log(`Usando usuario existente: ${anyUser.email}\n`)
      } else {
        console.error('No hay usuarios en la base de datos')
        console.log('Registra un usuario primero en la aplicacion')
        process.exit(1)
      }
    }
  }

  const resultados: { id: string; archivo: string; exito: boolean; mensaje: string; errores: string[]; advertencias: string[] }[] = []

  for (const archivo of archivos) {
    const rutaArchivo = path.join(scrapDir, archivo)
    console.log(`Procesando: ${archivo}`)

    try {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8')
      const data = JSON.parse(contenido)
      const inmuebles: InmuebleScraping[] = Array.isArray(data) ? data : [data]

      for (const inmueble of inmuebles) {
        const validacion = validarInmueble(inmueble)
        const datosNormalizados = normalizarInmueble(inmueble)

        if (validacion.errores.length > 0) {
          console.log(`  ERROR - ${inmueble.id}`)
          validacion.errores.forEach(e => console.log(`    - ${e}`))
          resultados.push({
            id: inmueble.id,
            archivo,
            exito: false,
            mensaje: 'Errores de validacion',
            errores: validacion.errores,
            advertencias: validacion.advertencias,
          })
          continue
        }

        if (validacion.advertencias.length > 0) {
          console.log(`  ADVERTENCIA - ${inmueble.id}`)
          validacion.advertencias.forEach(a => console.log(`    - ${a}`))
        }

        const resultado = await importarInmueble(datosNormalizados, propietarioId!, dryRun)
        
        resultados.push({
          id: inmueble.id,
          archivo,
          exito: resultado.exito,
          mensaje: resultado.mensaje,
          errores: resultado.errores || [],
          advertencias: validacion.advertencias,
        })

        if (resultado.exito) {
          console.log(`  OK - ${resultado.mensaje}`)
        } else {
          console.log(`  ERROR - ${resultado.mensaje}`)
        }
      }
    } catch (error: any) {
      console.error(`  Error al leer archivo: ${error.message}`)
      resultados.push({
        id: archivo,
        archivo,
        exito: false,
        mensaje: `Error al leer: ${error.message}`,
        errores: [error.message],
        advertencias: [],
      })
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('RESUMEN')
  console.log('='.repeat(60))
  
  const exitosos = resultados.filter(r => r.exito).length
  const fallidos = resultados.filter(r => !r.exito).length
  const conAdvertencias = resultados.filter(r => r.advertencias.length > 0).length
  
  console.log(`Exitosos: ${exitosos}`)
  console.log(`Fallidos: ${fallidos}`)
  console.log(`Con advertencias: ${conAdvertencias}`)
  console.log(`Total: ${resultados.length}`)

  if (dryRun) {
    console.log('\n[DRY RUN] No se realizo ningun cambio en la base de datos')
  }

  if (fallidos > 0) {
    console.log('\nDetalles de errores:')
    resultados.filter(r => !r.exito).forEach(r => {
      console.log(`  - ${r.id}: ${r.mensaje}`)
    })
  }

  console.log(`\nCompletado!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())