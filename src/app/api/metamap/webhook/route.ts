import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const METAMAP_WEBHOOK_SECRET = process.env.METAMAP_WEBHOOK_SECRET || ''

interface VerificacionRecord {
  id: string
  usuario_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const resource = body.resource || body.data || body

    if (!resource || !resource.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (METAMAP_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-metamap-signature')
        || request.headers.get('signature')
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
    }

    const admin = createAdminClient()

    const identityId = resource.id
    const status = (resource.status || resource.reviewStatus || '').toLowerCase()

    let verificacion: VerificacionRecord | null = null

    const { data: byIdentity } = await admin
      .from('verificaciones_documento')
      .select('id, usuario_id')
      .eq('metamap_identity_id', identityId)
      .maybeSingle()

    if (byIdentity) {
      verificacion = byIdentity as VerificacionRecord
    } else {
      const { data: byFlow } = await admin
        .from('verificaciones_documento')
        .select('id, usuario_id')
        .eq('metamap_flow_id', identityId)
        .maybeSingle()

      if (byFlow) {
        verificacion = byFlow as VerificacionRecord
      }
    }

    if (!verificacion) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    let nuevoEstado: string
    let esAprobada = false

    if (['verified', 'approved', 'done'].includes(status)) {
      nuevoEstado = 'APROBADA'
      esAprobada = true
    } else if (['rejected', 'declined'].includes(status)) {
      nuevoEstado = 'RECHAZADA'
    } else {
      nuevoEstado = 'EN_PROCESO'
    }

    const updateData: Record<string, unknown> = {
      estado: nuevoEstado,
      metamap_resultado: resource,
      fecha_actualizacion: new Date().toISOString(),
    }

    if (nuevoEstado === 'RECHAZADA') {
      updateData.motivo_rechazo = 'MetaMap: Verificación rechazada automáticamente'
    }

    if (esAprobada) {
      updateData.fecha_revision = new Date().toISOString()
    }

    await admin
      .from('verificaciones_documento')
      .update(updateData)
      .eq('id', verificacion.id)

    if (esAprobada && verificacion.usuario_id) {
      await admin
        .from('usuarios')
        .update({ verificado: true })
        .eq('id', verificacion.usuario_id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[metamap/webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
