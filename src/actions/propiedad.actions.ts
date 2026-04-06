// Acciones del servidor para propiedades
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { propiedadSchema } from '@/lib/validations'

/**
 * Obtiene el usuario autenticado actual
 */
async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Crea una nueva propiedad
 */
export async function crearPropiedad(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const datos = {
    titulo: formData.get('titulo') as string,
    descripcion: formData.get('descripcion') as string,
    tipoPropiedad: formData.get('tipoPropiedad') as string,
    precioPorNoche: formData.get('precioPorNoche') as string,
    moneda: (formData.get('moneda') as string) || 'USD',
    capacidadMaxima: formData.get('capacidadMaxima') as string,
    habitaciones: formData.get('habitaciones') as string,
    banos: formData.get('banos') as string,
    camas: formData.get('camas') as string,
    direccion: formData.get('direccion') as string,
    ciudad: formData.get('ciudad') as string,
    estado: formData.get('estado') as string,
    zona: formData.get('zona') as string || undefined,
    latitud: formData.get('latitud') as string || undefined,
    longitud: formData.get('longitud') as string || undefined,
    reglas: formData.get('reglas') as string || undefined,
    politicaCancelacion: (formData.get('politicaCancelacion') as string) || 'MODERADA',
    horarioCheckIn: (formData.get('horarioCheckIn') as string) || '14:00',
    horarioCheckOut: (formData.get('horarioCheckOut') as string) || '11:00',
    estanciaMinima: formData.get('estanciaMinima') as string,
    estanciaMaxima: formData.get('estanciaMaxima') as string || undefined,
    amenidades: formData.getAll('amenidades') as string[],
  }

  const validacion = propiedadSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const data = validacion.data

  // Crear la propiedad
  const propiedad = await prisma.propiedad.create({
    data: {
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipoPropiedad: data.tipoPropiedad,
      precioPorNoche: data.precioPorNoche,
      moneda: data.moneda,
      capacidadMaxima: data.capacidadMaxima,
      habitaciones: data.habitaciones,
      banos: data.banos,
      camas: data.camas,
      direccion: data.direccion,
      ciudad: data.ciudad,
      estado: data.estado,
      zona: data.zona,
      latitud: data.latitud,
      longitud: data.longitud,
      reglas: data.reglas,
      politicaCancelacion: data.politicaCancelacion,
      horarioCheckIn: data.horarioCheckIn,
      horarioCheckOut: data.horarioCheckOut,
      estanciaMinima: data.estanciaMinima,
      estanciaMaxima: data.estanciaMaxima,
      propietarioId: user.id,
      estadoPublicacion: 'BORRADOR',
    },
  })

  // Conectar amenidades
  if (data.amenidades.length > 0) {
    await prisma.propiedadAmenidad.createMany({
      data: data.amenidades.map((amenidadId) => ({
        propiedadId: propiedad.id,
        amenidadId,
      })),
    })
  }

  revalidatePath('/dashboard/mis-propiedades')
  redirect(`/dashboard/mis-propiedades`)
}

/**
 * Actualiza el estado de publicación de una propiedad
 */
export async function actualizarEstadoPropiedad(propiedadId: string, estado: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const propiedad = await prisma.propiedad.findFirst({
    where: { id: propiedadId, propietarioId: user.id },
  })

  if (!propiedad) return { error: 'Propiedad no encontrada' }

  await prisma.propiedad.update({
    where: { id: propiedadId },
    data: {
      estadoPublicacion: estado as 'PUBLICADA' | 'PAUSADA' | 'BORRADOR',
      fechaPublicacion: estado === 'PUBLICADA' ? new Date() : undefined,
    },
  })

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

/**
 * Obtiene las propiedades del usuario autenticado
 */
export async function getMisPropiedades() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  return prisma.propiedad.findMany({
    where: { propietarioId: user.id },
    include: {
      imagenes: {
        where: { esPrincipal: true },
        take: 1,
      },
    },
    orderBy: { fechaActualizacion: 'desc' },
  })
}

/**
 * Obtiene propiedades públicas con filtros
 */
export async function getPropiedadesPublicas(filtros?: {
  ubicacion?: string
  precioMin?: number
  precioMax?: number
  huespedes?: number
  tipoPropiedad?: string
  pagina?: number
}) {
  const pagina = filtros?.pagina || 1
  const porPagina = 12

  const where: Record<string, unknown> = {
    estadoPublicacion: 'PUBLICADA',
  }

  if (filtros?.ubicacion) {
    where.OR = [
      { ciudad: { contains: filtros.ubicacion, mode: 'insensitive' } },
      { estado: { contains: filtros.ubicacion, mode: 'insensitive' } },
      { zona: { contains: filtros.ubicacion, mode: 'insensitive' } },
    ]
  }

  if (filtros?.precioMin || filtros?.precioMax) {
    where.precioPorNoche = {
      gte: filtros.precioMin,
      lte: filtros.precioMax,
    }
  }

  if (filtros?.huespedes) {
    where.capacidadMaxima = { gte: filtros.huespedes }
  }

  if (filtros?.tipoPropiedad) {
    where.tipoPropiedad = filtros.tipoPropiedad
  }

  const [propiedades, total] = await Promise.all([
    prisma.propiedad.findMany({
      where,
      include: {
        imagenes: {
          where: { esPrincipal: true },
          take: 1,
        },
      },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      orderBy: { fechaPublicacion: 'desc' },
    }),
    prisma.propiedad.count({ where }),
  ])

  return {
    datos: propiedades,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  }
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getPropiedadPorId(id: string) {
  return prisma.propiedad.findUnique({
    where: { id },
    include: {
      propietario: {
        select: { id: true, nombre: true, apellido: true, avatarUrl: true, verificado: true },
      },
      imagenes: { orderBy: { orden: 'asc' } },
      amenidades: { include: { amenidad: true } },
      resenas: {
        take: 10,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          autor: { select: { nombre: true, apellido: true, avatarUrl: true } },
        },
      },
    },
  })
}
