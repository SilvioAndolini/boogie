// Acciones del servidor para reservas
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { reservaSchema } from '@/lib/validations'
import { calcularPrecioReserva } from '@/lib/calculations'

async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Crea una nueva reserva
 */
export async function crearReserva(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const datos = {
    propiedadId: formData.get('propiedadId') as string,
    fechaEntrada: formData.get('fechaEntrada') as string,
    fechaSalida: formData.get('fechaSalida') as string,
    cantidadHuespedes: formData.get('cantidadHuespedes') as string,
    notasHuesped: formData.get('notasHuesped') as string || undefined,
  }

  const validacion = reservaSchema.safeParse({
    ...datos,
    fechaEntrada: new Date(datos.fechaEntrada),
    fechaSalida: new Date(datos.fechaSalida),
    cantidadHuespedes: parseInt(datos.cantidadHuespedes),
  })

  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const data = validacion.data

  // Obtener la propiedad
  const propiedad = await prisma.propiedad.findUnique({
    where: { id: data.propiedadId },
  })

  if (!propiedad) return { error: 'Propiedad no encontrada' }
  if (propiedad.estadoPublicacion !== 'PUBLICADA') return { error: 'Propiedad no disponible' }

  // Verificar disponibilidad
  const reservasExistentes = await prisma.reserva.findMany({
    where: {
      propiedadId: data.propiedadId,
      estado: { in: ['CONFIRMADA', 'PENDIENTE', 'EN_CURSO'] },
      fechaEntrada: { lt: data.fechaSalida },
      fechaSalida: { gt: data.fechaEntrada },
    },
  })

  if (reservasExistentes.length > 0) {
    return { error: 'Las fechas seleccionadas no están disponibles' }
  }

  // Calcular precios
  const precios = calcularPrecioReserva(
    Number(propiedad.precioPorNoche),
    data.fechaEntrada,
    data.fechaSalida
  )

  // Crear la reserva
  const reserva = await prisma.reserva.create({
    data: {
      propiedadId: data.propiedadId,
      huespedId: user.id,
      fechaEntrada: data.fechaEntrada,
      fechaSalida: data.fechaSalida,
      noches: precios.noches,
      precioPorNoche: precios.precioPorNoche,
      subtotal: precios.subtotal,
      comisionPlataforma: precios.comisionHuesped,
      comisionAnfitrion: precios.comisionAnfitrion,
      total: precios.total,
      moneda: propiedad.moneda,
      cantidadHuespedes: data.cantidadHuespedes,
      notasHuesped: data.notasHuesped,
    },
  })

  revalidatePath('/dashboard/mis-reservas')
  redirect(`/dashboard/mis-reservas/${reserva.id}`)
}

/**
 * Confirma una reserva (anfitrión)
 */
export async function confirmarReserva(reservaId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const reserva = await prisma.reserva.findFirst({
    where: { id: reservaId },
    include: { propiedad: true },
  })

  if (!reserva) return { error: 'Reserva no encontrada' }
  if (reserva.propiedad.propietarioId !== user.id) return { error: 'Sin permisos' }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: 'CONFIRMADA', fechaConfirmacion: new Date() },
  })

  revalidatePath('/dashboard/reservas-recibidas')
  return { exito: true }
}

/**
 * Rechaza una reserva (anfitrión)
 */
export async function rechazarReserva(reservaId: string, motivo?: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const reserva = await prisma.reserva.findFirst({
    where: { id: reservaId },
    include: { propiedad: true },
  })

  if (!reserva) return { error: 'Reserva no encontrada' }
  if (reserva.propiedad.propietarioId !== user.id) return { error: 'Sin permisos' }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: 'RECHAZADA', fechaCancelacion: new Date(), notasInternas: motivo },
  })

  revalidatePath('/dashboard/reservas-recibidas')
  return { exito: true }
}

/**
 * Cancela una reserva (huésped)
 */
export async function cancelarReserva(reservaId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const reserva = await prisma.reserva.findFirst({
    where: { id: reservaId, huespedId: user.id },
  })

  if (!reserva) return { error: 'Reserva no encontrada' }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: 'CANCELADA_HUESPED', fechaCancelacion: new Date() },
  })

  revalidatePath('/dashboard/mis-reservas')
  return { exito: true }
}

/**
 * Obtiene las reservas del huésped
 */
export async function getMisReservas() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  return prisma.reserva.findMany({
    where: { huespedId: user!.id },
    include: {
      propiedad: {
        include: {
          imagenes: { where: { esPrincipal: true }, take: 1 },
        },
      },
      pagos: true,
    },
    orderBy: { fechaCreacion: 'desc' },
  })
}

/**
 * Obtiene las reservas recibidas (anfitrión)
 */
export async function getReservasRecibidas() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  return prisma.reserva.findMany({
    where: {
      propiedad: { propietarioId: user!.id },
    },
    include: {
      huesped: { select: { nombre: true, apellido: true, avatarUrl: true } },
      propiedad: {
        include: {
          imagenes: { where: { esPrincipal: true }, take: 1 },
        },
      },
      pagos: true,
    },
    orderBy: { fechaCreacion: 'desc' },
  })
}
