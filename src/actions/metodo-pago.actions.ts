'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goGet, goPost, goDelete } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function getMetodosPago() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const metodos = await goGet('/api/v1/metodos-pago')
    return { metodos }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al consultar metodos de pago' }
  }
}

export async function crearMetodoPago(datos: {
  tipo: string
  banco?: string
  telefono?: string
  cedula?: string
  numero_cuenta?: string
  titular?: string
  email_zelle?: string
  direccion_usdt?: string
}) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const metodo = await goPost('/api/v1/metodos-pago', datos)
    revalidatePath('/dashboard/pagos/configuracion')
    return { metodo }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al guardar el metodo de pago' }
  }
}

export async function eliminarMetodoPago(id: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goDelete(`/api/v1/metodos-pago/${id}`)
    revalidatePath('/dashboard/pagos/configuracion')
    return { exito: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar el metodo de pago' }
  }
}
