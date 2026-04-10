import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const METAMAP_WEBHOOK_SECRET = process.env.METAMAP_WEBHOOK_SECRET || ''

interface VerificacionRecord {
  id: string
  usuario_id: string
}

function verifyMetaMapSignature(body: string, signature: string): boolean {
  const expected = createHmac('sha256', METAMAP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const resource = (body.resource || body.data || body) as Record<string, unknown> | undefined

    if (!resource || !resource.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (!METAMAP_WEBHOOK_SECRET) {
      console.error('[metamap/webhook] CRITICAL: METAMAP_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const signature = request.headers.get('x-metamap-signature')
      || request.headers.get('signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifyMetaMapSignature(rawBody, signature)) {
      console.warn('[metamap/webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
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
