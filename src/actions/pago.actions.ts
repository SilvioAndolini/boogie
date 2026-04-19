'use server'

import { revalidatePath } from 'next/cache'
import { pagoSchema } from '@/lib/validations'
import { getUsuarioAutenticado } from '@/lib/auth'
import { goGet, goPost } from '@/lib/go-api-client'

export async function registrarPago(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    reservaId: formData.get('reservaId') as string,
    metodoPago: formData.get('metodoPago') as string,
    referencia: (formData.get('referencia') as string) || undefined,
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

  try {
    await goPost('/api/v1/pagos/registrar', {
      reservaId: data.reservaId,
      metodoPago: data.metodoPago,
      referencia: data.referencia,
      monto: data.monto,
      moneda: data.moneda,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al registrar el pago'
    return { error: message }
  }

  revalidatePath('/dashboard/pagos')
  return { exito: true, mensaje: 'Pago registrado. Será verificado pronto.' }
}

export async function getMisPagos() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  try {
    return await goGet<Record<string, unknown>[]>('/api/v1/pagos/mis-pagos') ?? []
  } catch {
    return []
  }
}
