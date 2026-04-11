import { NextRequest, NextResponse } from 'next/server'
import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildMoonPayUrl, getMoonPayWalletAddress } from '@/lib/payments/moonpay'
import { APP_URL } from '@/lib/constants'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'
import { calcularPrecioReserva } from '@/lib/reservas/calculos'

export async function POST(req: NextRequest) {
  const step = '[payments/card/create]'
  try {
    const user = await getUsuarioAutenticado()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { monto, propiedadId, fechaEntrada, fechaSalida, cantidadHuespedes } = body as {
      monto: number
      propiedadId?: string
      fechaEntrada?: string
      fechaSalida?: string
      cantidadHuespedes?: number
    }

    console.log(step, 'Request:', { monto, propiedadId })

    if (!monto || monto <= 0 || !propiedadId || !fechaEntrada || !fechaSalida || !cantidadHuespedes) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const walletAddress = getMoonPayWalletAddress()
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet no configurada' }, { status: 500 })
    }

    const admin = createAdminClient()

    const disponibilidad = await verificarDisponibilidad(
      propiedadId, new Date(fechaEntrada), new Date(fechaSalida)
    )
    if (!disponibilidad.disponible) {
      return NextResponse.json({ error: 'Las fechas ya no estan disponibles' }, { status: 400 })
    }

    const { data: propiedad, error: propError } = await admin
      .from('propiedades')
      .select('titulo, precio_por_noche, moneda, propietario_id')
      .eq('id', propiedadId)
      .single()

    if (propError || !propiedad) {
      console.error(step, 'Propiedad error:', propError)
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const calculo = calcularPrecioReserva(
      Number(propiedad.precio_por_noche),
      new Date(fechaEntrada),
      new Date(fechaSalida),
      propiedad.moneda as 'USD' | 'VES'
    )
    const codigoReserva = 'BOO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    const reservaId = crypto.randomUUID()

    const { error: insertError } = await admin
      .from('reservas')
      .insert({
        id: reservaId,
        codigo: codigoReserva,
        propiedad_id: propiedadId,
        huesped_id: user.id,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        noches: calculo.noches,
        precio_por_noche: calculo.precioPorNoche,
        subtotal: calculo.subtotal,
        comision_plataforma: calculo.comisionHuesped,
        comision_anfitrion: calculo.comisionAnfitrion,
        total: calculo.total,
        moneda: calculo.moneda,
        cantidad_huespedes: cantidadHuespedes,
        estado: 'PENDIENTE',
      })

    if (insertError) {
      console.error(step, 'Reserva insert error:', insertError)
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
    }

    console.log(step, 'Reserva creada:', reservaId)

    const externalTxId = reservaId

    try {
      await admin.from('pagos').insert({
        id: crypto.randomUUID(),
        monto,
        moneda: 'USD',
        metodo_pago: 'TARJETA_INTERNACIONAL',
        estado: 'PENDIENTE',
        referencia: `MoonPay TX: ${externalTxId}`,
        fecha_creacion: new Date().toISOString(),
        reserva_id: reservaId,
        usuario_id: user.id,
      })
    } catch (pagoErr) {
      console.error(step, 'Pago insert error:', pagoErr)
    }

    try {
      await admin.from('notificaciones').insert({
        tipo: 'NUEVA_RESERVA',
        titulo: 'Nueva reserva recibida',
        mensaje: `Tienes una nueva reserva con tarjeta para "${propiedad.titulo}"`,
        usuario_id: propiedad.propietario_id,
        url_accion: '/dashboard/reservas-recibidas',
      })
    } catch (notifErr) {
      console.error(step, 'Notificacion error:', notifErr)
    }

    const moonpayUrl = buildMoonPayUrl({
      baseCurrencyCode: 'usd',
      baseCurrencyAmount: monto,
      defaultCurrencyCode: 'usdt_trc20',
      walletAddress,
      email: user.email,
      externalTransactionId: externalTxId,
    })

    console.log(step, 'MoonPay URL generada')

    return NextResponse.json({
      checkoutUrl: moonpayUrl,
      reservaId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[payments/card/create] FATAL:', message)
    return NextResponse.json({ error: `Error interno: ${message}` }, { status: 500 })
  }
}
