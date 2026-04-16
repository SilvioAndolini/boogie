'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goGet, goPost, goDelete } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function getBoogieDashboard(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const data = await goGet<Record<string, unknown>>(`/api/v1/propiedades/${propiedadId}/dashboard`)
    const propiedad = (data.propiedad as Record<string, unknown>) || {}
    propiedad.capacidad_maxima = propiedad.capacidad
    propiedad.habitaciones = propiedad.dormitorios
    propiedad.horario_checkin = propiedad.check_in
    propiedad.horario_checkout = propiedad.check_out
    propiedad.cantidad_resenas = propiedad.cantidad_resenas ?? propiedad.total_resenas ?? 0
    propiedad.amenidades = data.amenidades

    return {
      propiedad,
      reservas: (data.reservas as Record<string, unknown>[]) || [],
      gastos: (data.gastos as Record<string, unknown>[]) || [],
      fechasBloqueadas: (data.fechasBloqueadas as Record<string, unknown>[]) || [],
      preciosEspeciales: (data.preciosEspeciales as Record<string, unknown>[]) || [],
      kpis: data.kpis as {
        totalIngresos: number; totalGastos: number; totalGastosVes: number;
        balance: number; totalReservas: number; reservasActivas: number;
        reservasConfirmadas: number; totalNoches: number; tarifaPromedio: number;
      },
      ingresosByMonth: (data.ingresosByMonth as Record<string, number>) || {},
      gastosByMonth: (data.gastosByMonth as Record<string, number>) || {},
      ocupadas: (data.ocupadas as { fecha_entrada: string; fecha_salida: string; estado: string; huesped?: string }[]) || [],
    }
  } catch (err: any) {
    console.error('[getBoogieDashboard] ERROR:', err?.message, err?.status, err?.code, err?.stack)
    return { error: err.message || 'Boogie no encontrado' }
  }
}

export async function crearGastoMantenimiento(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const propiedadId = formData.get('propiedadId') as string
  const descripcion = formData.get('descripcion') as string
  const monto = parseFloat(formData.get('monto') as string)
  const moneda = (formData.get('moneda') as string) || 'USD'
  const categoria = formData.get('categoria') as string
  const fecha = formData.get('fecha') as string

  if (!propiedadId || !descripcion || isNaN(monto) || monto <= 0 || !categoria) {
    return { error: 'Todos los campos son requeridos' }
  }

  try {
    await goPost(`/api/v1/propiedades/${propiedadId}/gastos`, {
      descripcion, monto, moneda, categoria, fecha,
    })
    revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
    return { exito: true }
  } catch (err: any) {
    return { error: err.message || 'Error al crear el gasto' }
  }
}

export async function eliminarGastoMantenimiento(gastoId: string, propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goDelete(`/api/v1/propiedades/${propiedadId}/gastos/${gastoId}`)
    revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
    return { exito: true }
  } catch (err: any) {
    return { error: err.message || 'Error al eliminar el gasto' }
  }
}
