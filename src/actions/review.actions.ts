'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { resenaSchema } from '@/lib/validations'
import { getUsuarioAutenticado } from '@/lib/auth'

export async function crearResena(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    calificacion: parseInt(formData.get('calificacion') as string),
    limpieza: formData.get('limpieza') ? parseInt(formData.get('limpieza') as string) : undefined,
    comunicacion: formData.get('comunicacion') ? parseInt(formData.get('comunicacion') as string) : undefined,
    ubicacion: formData.get('ubicacion') ? parseInt(formData.get('ubicacion') as string) : undefined,
    valor: formData.get('valor') ? parseInt(formData.get('valor') as string) : undefined,
    comentario: formData.get('comentario') as string,
  }

  const validacion = resenaSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const reservaId = formData.get('reservaId') as string
  const supabase = createAdminClient()

  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, propiedad_id')
    .eq('id', reservaId)
    .eq('huesped_id', user!.id)
    .eq('estado', 'COMPLETADA')
    .single()

  if (!reserva) return { error: 'No puedes reseñar esta reserva' }

  const { data: existing } = await supabase
    .from('resenas')
    .select('id')
    .eq('reserva_id', reservaId)
    .single()

  if (existing) return { error: 'Ya escribiste una reseña para esta reserva' }

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('propietario_id')
    .eq('id', reserva.propiedad_id)
    .single()

  const { error: insertError } = await supabase
    .from('resenas')
    .insert({
      calificacion: validacion.data.calificacion,
      limpieza: validacion.data.limpieza,
      comunicacion: validacion.data.comunicacion,
      ubicacion: validacion.data.ubicacion,
      valor: validacion.data.valor,
      comentario: validacion.data.comentario,
      propiedad_id: reserva.propiedad_id,
      autor_id: user!.id,
      anfitrion_id: propiedad?.propietario_id,
      reserva_id: reservaId,
    })

  if (insertError) {
    console.error('[crearResena] Error:', insertError)
    return { error: 'Error al crear la reseña' }
  }

  const { data: stats } = await supabase
    .from('resenas')
    .select('calificacion')
    .eq('propiedad_id', reserva.propiedad_id)

  if (stats && stats.length > 0) {
    const avgRating = stats.reduce((sum: number, r: Record<string, unknown>) => sum + (r.calificacion as number), 0) / stats.length
    await supabase
      .from('propiedades')
      .update({
        rating_promedio: Math.round(avgRating * 10) / 10,
        total_resenas: stats.length,
      })
      .eq('id', reserva.propiedad_id)
  }

  revalidatePath(`/propiedades/${reserva.propiedad_id}`)
  return { exito: true }
}

export async function responderResena(resenaId: string, respuesta: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: resena } = await supabase
    .from('resenas')
    .select('id, anfitrion_id, propiedad_id')
    .eq('id', resenaId)
    .single()

  if (!resena) return { error: 'Reseña no encontrada' }
  if ((resena as Record<string, unknown>).anfitrion_id !== user.id) return { error: 'Sin permisos' }

  const { error: updateError } = await supabase
    .from('resenas')
    .update({ respuesta, fecha_respuesta: new Date().toISOString() })
    .eq('id', resenaId)

  if (updateError) {
    console.error('[responderResena] Error:', updateError)
    return { error: 'Error al responder' }
  }

  revalidatePath(`/propiedades/${(resena as Record<string, unknown>).propiedad_id}`)
  return { exito: true }
}
