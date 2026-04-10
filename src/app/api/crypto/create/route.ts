import { NextRequest, NextResponse } from 'next/server'
import { createCryptapiAddress, getWalletAddress, CRYPTAPI_TICKER, CRYPTAPI_NETWORK, CRYPTAPI_CURRENCY } from '@/lib/crypto/cryptapi'
import { APP_URL } from '@/lib/constants'
import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'
import { calcularPrecioReserva } from '@/lib/reservas/calculos'

export async function POST(req: NextRequest) {
  const step = '[crypto/create]'
  try {
    const user = await getUsuarioAutenticado()
    if (!user) {
      console.error(step, 'No autenticado')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      reservaId,
      monto,
      propiedadId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes,
    } = body as {
      reservaId?: string
      monto: number
      propiedadId?: string
      fechaEntrada?: string
      fechaSalida?: string
      cantidadHuespedes?: number
    }

    console.log(step, 'Request:', { reservaId, monto, propiedadId, fechaEntrada, fechaSalida, cantidadHuespedes })

    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'Monto invalido' }, { status: 400 })
    }

    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      console.error(step, 'CRYPTAPI_WALLET_ADDRESS no configurada')
      return NextResponse.json({ error: 'Wallet no configurada (falta CRYPTAPI_WALLET_ADDRESS)' }, { status: 500 })
    }

    const needCreateReserva = !reservaId
    if (needCreateReserva && (!propiedadId || !fechaEntrada || !fechaSalida || !cantidadHuespedes)) {
      return NextResponse.json({ error: 'Faltan datos: propiedadId, fechaEntrada, fechaSalida, cantidadHuespedes' }, { status: 400 })
    }

    let reservaIdFinal = reservaId || null
    let propiedadData: {
      titulo: string
      precio_por_noche: number
      moneda: string
      propietario_id: string
    } | null = null

    if (needCreateReserva) {
      console.log(step, 'Verificando disponibilidad...')
      const admin = createAdminClient()

      const disponibilidad = await verificarDisponibilidad(
        propiedadId!, new Date(fechaEntrada!), new Date(fechaSalida!)
      )
      if (!disponibilidad.disponible) {
        const msg = disponibilidad.conflicto?.tipo === 'FECHA_BLOQUEADA'
          ? 'Las fechas seleccionadas estan bloqueadas'
          : 'Las fechas seleccionadas ya no estan disponibles'
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      const { data: prop, error: propError } = await admin
        .from('propiedades')
        .select('titulo, precio_por_noche, moneda, propietario_id')
        .eq('id', propiedadId!)
        .single()

      if (propError || !prop) {
        console.error(step, 'Propiedad error:', propError)
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
      }
      propiedadData = prop as NonNullable<typeof prop>
      console.log(step, 'Propiedad OK:', propiedadData.titulo)
    }

    const callbackBase = process.env.NEXT_PUBLIC_APP_URL || APP_URL
    console.log(step, 'Callback base:', callbackBase)
    const callbackParams = new URLSearchParams({
      propiedadId: propiedadId || '',
      fechaEntrada: fechaEntrada || '',
      fechaSalida: fechaSalida || '',
      secret: process.env.CRYPTAPI_CALLBACK_SECRET || '',
    })
    const cryptoCallbackUrl = `${callbackBase}/api/crypto/callback?${callbackParams.toString()}`

    console.log(step, 'Llamando CryptAPI...')
    const cryptoResult = await createCryptapiAddress({
      callbackUrl: cryptoCallbackUrl,
      address: walletAddress,
      pending: 1,
    })
    console.log(step, 'CryptAPI OK, address:', cryptoResult.address_in)

    if (needCreateReserva && propiedadData) {
      const pd = propiedadData
      const admin = createAdminClient()
      const calculo = calcularPrecioReserva(
        Number(pd.precio_por_noche),
        new Date(fechaEntrada!),
        new Date(fechaSalida!),
        pd.moneda as 'USD' | 'VES'
      )
      const codigoReserva = 'BOO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()

      console.log(step, 'Creando reserva...')
      const { data: reserva, error: insertError } = await admin
        .from('reservas')
        .insert({
          id: crypto.randomUUID(),
          codigo: codigoReserva,
          propiedad_id: propiedadId!,
          huesped_id: user.id,
          fecha_entrada: fechaEntrada!,
          fecha_salida: fechaSalida!,
          noches: calculo.noches,
          precio_por_noche: calculo.precioPorNoche,
          subtotal: calculo.subtotal,
          comision_plataforma: calculo.comisionHuesped,
          comision_anfitrion: calculo.comisionAnfitrion,
          total: calculo.total,
          moneda: calculo.moneda,
          cantidad_huespedes: cantidadHuespedes!,
          estado: 'PENDIENTE',
        })
        .select('id')
        .single()

      if (insertError || !reserva) {
        console.error(step, 'Reserva insert error:', insertError)
        return NextResponse.json({ error: 'Error al crear la reserva: ' + (insertError?.message || 'unknown') }, { status: 500 })
      }

      reservaIdFinal = reserva.id
      console.log(step, 'Reserva creada:', reservaIdFinal)

      try {
        await admin.from('notificaciones').insert({
          tipo: 'NUEVA_RESERVA',
          titulo: 'Nueva reserva recibida',
          mensaje: `Tienes una nueva reserva cripto para "${pd.titulo}"`,
          usuario_id: pd.propietario_id,
          url_accion: '/dashboard/reservas-recibidas',
        })
      } catch (notifErr) {
        console.error(step, 'Notificacion error:', notifErr)
      }
    }

    if (reservaIdFinal) {
      const admin = createAdminClient()
      const { error: pagoError } = await admin.from('pagos').insert({
        id: crypto.randomUUID(),
        monto,
        moneda: 'USD',
        metodo_pago: 'CRIPTO',
        estado: 'PENDIENTE',
        referencia: 'Crypto - pendiente TX',
        fecha_creacion: new Date().toISOString(),
        reserva_id: reservaIdFinal,
        usuario_id: user.id,
        crypto_address: cryptoResult.address_in,
      })
      if (pagoError) {
        console.error(step, 'Pago insert error:', pagoError)
      }
    }

    console.log(step, 'Todo OK, devolviendo address')
    return NextResponse.json({
      address: cryptoResult.address_in,
      reservaId: reservaIdFinal,
      ticker: CRYPTAPI_TICKER,
      network: CRYPTAPI_NETWORK,
      currency: CRYPTAPI_CURRENCY,
      amount: monto,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[crypto/create] FATAL:', message)
    return NextResponse.json({ error: `Error interno: ${message}` }, { status: 500 })
  }
}
