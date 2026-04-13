'use server'

import { createAdminClient } from '@/lib/supabase/admin'
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
    const admin = createAdminClient()
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

  try {
    await goPost('/api/v1/pagos/registrar-comprobante', {
      reservaId: datos.reservaId,
      monto: datos.monto,
      moneda: datos.moneda,
      metodoPago: datos.metodoPago,
      referencia: datos.referencia,
      bancoEmisor: datos.bancoEmisor,
      telefonoEmisor: datos.telefonoEmisor,
      comprobanteBase64: comprobanteUrl,
      comprobanteExt: datos.comprobanteExt,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al registrar el pago'
    return { error: message }
  }

  return { exito: true }
}
