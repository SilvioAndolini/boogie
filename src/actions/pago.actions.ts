// Acciones del servidor para pagos
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { pagoSchema } from '@/lib/validations'

async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Registra un pago para una reserva
 */
export async function registrarPago(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    reservaId: formData.get('reservaId') as string,
    metodoPago: formData.get('metodoPago') as string,
    referencia: formData.get('referencia') as string || undefined,
    monto: formData.get('monto') as string,
    moneda: (formData.get('moneda') as string) || 'USD',
  }

  const validacion = pagoSchema.safeParse({
    ...datos,
    monto: parseFloat(datos.monto),
  })

  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const data = validacion.data

  // Verificar que la reserva pertenece al usuario
  const reserva = await prisma.reserva.findFirst({
    where: { id: data.reservaId, huespedId: user!.id },
  })

  if (!reserva) return { error: 'Reserva no encontrada' }

  // Crear el pago
  await prisma.pago.create({
    data: {
      reservaId: data.reservaId,
      usuarioId: user!.id,
      monto: data.monto,
      moneda: data.moneda,
      metodoPago: data.metodoPago,
      referencia: data.referencia,
      estado: 'PENDIENTE',
    },
  })

  revalidatePath('/dashboard/pagos')
  return { exito: true, mensaje: 'Pago registrado. Será verificado pronto.' }
}

/**
 * Verifica un pago (anfitrión o admin)
 */
export async function verificarPago(pagoId: string, aprobado: boolean, notas?: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: { reserva: { include: { propiedad: true } } },
  })

  if (!pago) return { error: 'Pago no encontrado' }

  // Verificar permisos: debe ser el anfitrión de la propiedad o admin
  if (pago.reserva.propiedad.propietarioId !== user.id) {
    return { error: 'Sin permisos para verificar este pago' }
  }

  const estado = aprobado ? 'VERIFICADO' : 'RECHAZADO'

  await prisma.pago.update({
    where: { id: pagoId },
    data: {
      estado,
      verificadoPor: user.id,
      notasVerificacion: notas,
      fechaVerificacion: new Date(),
    },
  })

  // Si el pago fue verificado y la reserva estaba pendiente, confirmarla
  if (aprobado && pago.reserva.estado === 'PENDIENTE') {
    await prisma.reserva.update({
      where: { id: pago.reservaId },
      data: { estado: 'CONFIRMADA', fechaConfirmacion: new Date() },
    })
  }

  revalidatePath('/dashboard/reservas-recibidas')
  revalidatePath('/dashboard/pagos')
  return { exito: true }
}

/**
 * Obtiene el historial de pagos del usuario
 */
export async function getMisPagos() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  return prisma.pago.findMany({
    where: { usuarioId: user!.id },
    include: {
      reserva: {
        include: {
          propiedad: { select: { titulo: true } },
        },
      },
    },
    orderBy: { fechaCreacion: 'desc' },
  })
}
