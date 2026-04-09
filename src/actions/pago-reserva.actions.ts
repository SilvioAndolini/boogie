'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'

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

  const admin = createAdminClient()

  let comprobanteUrl: string | null = null

  if (datos.comprobanteBase64 && datos.comprobanteExt) {
    const { data: buckets } = await admin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === 'pagos')
    if (!bucketExists) {
      await admin.storage.createBucket('pagos', { public: true, fileSizeLimit: 5 * 1024 * 1024 })
    }

    const path = `comprobantes/${user.id}/${datos.reservaId}.${datos.comprobanteExt}`
    const buffer = Buffer.from(datos.comprobanteBase64, 'base64')
    const { error: uploadError } = await admin.storage
      .from('pagos')
      .upload(path, buffer, { upsert: true, contentType: `image/${datos.comprobanteExt}` })

    if (uploadError) {
      console.error('[registrarPagoReserva] Upload error:', uploadError.message)
    } else {
      const { data: urlData } = admin.storage.from('pagos').getPublicUrl(path)
      comprobanteUrl = urlData?.publicUrl || null
    }
  }

  const referenciaCompleta = [
    datos.referencia,
    datos.bancoEmisor ? `Banco: ${datos.bancoEmisor}` : '',
    datos.telefonoEmisor ? `Tel: ${datos.telefonoEmisor}` : '',
  ].filter(Boolean).join(' | ')

  const { error } = await admin.from('pagos').insert({
    id: crypto.randomUUID(),
    monto: datos.monto,
    moneda: datos.moneda,
    metodo_pago: datos.metodoPago,
    referencia: referenciaCompleta,
    comprobante: comprobanteUrl,
    estado: 'PENDIENTE',
    fecha_creacion: new Date().toISOString(),
    reserva_id: datos.reservaId,
    usuario_id: user.id,
  })

  if (error) {
    console.error('[registrarPagoReserva] Error:', error.message)
    return { error: `Error al registrar el pago: ${error.message}` }
  }

  return { exito: true }
}
