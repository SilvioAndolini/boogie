'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goPost } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function registrarPagoReserva(datos: {
  reservaId: string
  monto: number
  moneda: string
  metodoPago: string
  referencia: string
  bancoEmisor?: string
  telefonoEmisor?: string
  comprobanteBase64?: string
  comprobanteExt?: string
}) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  let comprobanteUrl: string | null = null

  if (datos.comprobanteBase64 && datos.comprobanteExt) {
    try {
      const uploadResult = await goPost<{ ok: boolean; url: string }>('/api/v1/pagos/subir-comprobante', {
        reservaId: datos.reservaId,
        comprobanteBase64: datos.comprobanteBase64,
        comprobanteExt: datos.comprobanteExt,
      })
      comprobanteUrl = uploadResult.url
    } catch (err) {
      console.error('[registrarPagoReserva] Upload error:', err)
    }
  }

  try {
    await goPost('/api/v1/pagos/registrar-comprobante', {
      reservaId: datos.reservaId,
      monto: datos.monto,
      moneda: datos.moneda,
      metodoPago: datos.metodoPago,
      referencia: datos.referencia,
      bancoEmisor: datos.bancoEmisor || null,
      telefonoEmisor: datos.telefonoEmisor || null,
      comprobanteUrl: comprobanteUrl,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al registrar el pago'
    return { error: message }
  }

  revalidatePath('/dashboard/mis-reservas')
  revalidatePath('/dashboard/reservas-recibidas')
  revalidatePath('/dashboard/pagos')
  return { exito: true }
}

export async function crearReservaConPago(datos: {
  propiedadId: string
  fechaEntrada: string
  fechaSalida: string
  cantidadHuespedes: number
  monto: number
  moneda: string
  metodoPago: string
  referencia: string
  bancoEmisor?: string
  telefonoEmisor?: string
  comprobanteBase64?: string
  comprobanteExt?: string
  storeItems?: Array<{
    tipo: string
    nombre: string
    cantidad: number
    precio: number
    moneda: string
    tipoPrecio?: string
    id: string
  }>
  noches?: number
}) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  let comprobanteUrl: string | null = null

  if (datos.comprobanteBase64 && datos.comprobanteExt) {
    try {
      const uploadResult = await goPost<{ ok: boolean; url: string }>('/api/v1/pagos/subir-comprobante', {
        reservaId: 'pending',
        comprobanteBase64: datos.comprobanteBase64,
        comprobanteExt: datos.comprobanteExt,
      })
      comprobanteUrl = uploadResult.url
    } catch (err) {
      console.error('[crearReservaConPago] Upload error:', err)
    }
  }

  const storeItems = (datos.storeItems || []).map((item) => ({
    tipo_item: item.tipo,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precio,
    moneda: item.moneda,
    subtotal: (item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
      ? item.precio * (datos.noches || 1)
      : item.precio) * item.cantidad,
    producto_id: item.tipo === 'producto' ? item.id : null,
    servicio_id: item.tipo === 'servicio' ? item.id : null,
  }))

  try {
    const reserva = await goPost('/api/v1/reservas/crear-con-pago', {
      propiedadId: datos.propiedadId,
      fechaEntrada: datos.fechaEntrada,
      fechaSalida: datos.fechaSalida,
      cantidadHuespedes: datos.cantidadHuespedes,
      monto: datos.monto,
      moneda: datos.moneda,
      metodoPago: datos.metodoPago,
      referencia: datos.referencia,
      bancoEmisor: datos.bancoEmisor || null,
      telefonoEmisor: datos.telefonoEmisor || null,
      comprobanteUrl: comprobanteUrl,
      storeItems,
    })
    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath('/dashboard/pagos')
    revalidatePath('/admin/reservas')
    revalidatePath('/admin/pagos')
    return { exito: true, reservaId: (reserva as Record<string, unknown>).id as string }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al crear la reserva'
    return { error: message }
  }
}
