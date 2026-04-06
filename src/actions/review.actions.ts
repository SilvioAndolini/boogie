// Acciones del servidor para reseñas
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { resenaSchema } from '@/lib/validations'

async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Crea una reseña para una reserva completada
 */
export async function crearResena(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    calificacion: parseInt(formData.get('calificacion') as string),
    limpieza: formData.get('limpieza') ? parseInt(formData.get('limpieza') as string) : undefined,
    comunicacion: formData.get('comunicacion') ? parseInt(formData.get('comunicacion') as string) : undefined,
    ubicacion: formData.get('ubicacion') ? parseInt(formData.get('ubicacion') as string) : undefined,
    valor: formData.get('valor') ? parseInt(formData.get('valor') as string) : undefined,
    comentario: formData.get('comentario') as string,
  }

  const validacion = resenaSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const reservaId = formData.get('reservaId') as string

  // Verificar que la reserva existe, está completada y pertenece al usuario
  const reserva = await prisma.reserva.findFirst({
    where: {
      id: reservaId,
      huespedId: user!.id,
      estado: 'COMPLETADA',
    },
  })

  if (!reserva) return { error: 'No puedes reseñar esta reserva' }

  // Verificar que no exista ya una reseña
  const resenaExistente = await prisma.resena.findUnique({
    where: { reservaId },
  })

  if (resenaExistente) return { error: 'Ya escribiste una reseña para esta reserva' }

  // Crear la reseña
  await prisma.resena.create({
    data: {
      calificacion: validacion.data.calificacion,
      limpieza: validacion.data.limpieza,
      comunicacion: validacion.data.comunicacion,
      ubicacion: validacion.data.ubicacion,
      valor: validacion.data.valor,
      comentario: validacion.data.comentario,
      propiedadId: reserva.propiedadId,
      autorId: user!.id,
      anfitrionId: (await prisma.propiedad.findUnique({
        where: { id: reserva.propiedadId },
        select: { propietarioId: true },
      }))!.propietarioId,
      reservaId,
    },
  })

  // Actualizar rating promedio de la propiedad
  const stats = await prisma.resena.aggregate({
    where: { propiedadId: reserva.propiedadId },
    _avg: { calificacion: true },
    _count: true,
  })

  await prisma.propiedad.update({
    where: { id: reserva.propiedadId },
    data: {
      ratingPromedio: stats._avg.calificacion,
      totalResenas: stats._count,
    },
  })

  revalidatePath(`/propiedades/${reserva.propiedadId}`)
  return { exito: true }
}

/**
 * Responde a una reseña (anfitrión)
 */
export async function responderResena(resenaId: string, respuesta: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const resena = await prisma.resena.findUnique({
    where: { id: resenaId },
  })

  if (!resena) return { error: 'Reseña no encontrada' }
  if (resena.anfitrionId !== user.id) return { error: 'Sin permisos' }

  await prisma.resena.update({
    where: { id: resenaId },
    data: { respuesta, fechaRespuesta: new Date() },
  })

  revalidatePath(`/propiedades/${resena.propiedadId}`)
  return { exito: true }
}
