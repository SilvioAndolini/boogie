'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goPost } from '@/lib/go-api-client'

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

  return { exito: true }
}

export async function agregarStoreItems(reservaId: string, items: Array<{
  tipo: string
  nombre: string
  cantidad: number
  precio: number
  moneda: string
  tipoPrecio?: string
  id: string
}>, noches: number) {
  try {
    const storeItems = items.map((item) => ({
      tipo_item: item.tipo,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      moneda: item.moneda,
      subtotal: (item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
        ? item.precio * noches
        : item.precio) * item.cantidad,
      producto_id: item.tipo === 'producto' ? item.id : null,
      servicio_id: item.tipo === 'servicio' ? item.id : null,
    }))

    await goPost('/api/v1/pagos/store-items', {
      reservaId,
      items: storeItems,
    })
  } catch (err) {
    console.error('[agregarStoreItems] Error:', err)
  }
}
