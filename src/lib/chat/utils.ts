import { Mensaje, Conversacion } from '@/types/chat'
import { PREVIEW_MAX_LENGTH } from './constants'

export function generarPreview(mensaje: Mensaje): string {
  if (mensaje.tipo === 'imagen' && !mensaje.contenido) return '📷 Imagen'
  if (mensaje.tipo === 'rapido') return `⚡ ${mensaje.contenido || ''}`
  return (mensaje.contenido || '').slice(0, PREVIEW_MAX_LENGTH)
}

export function ordenarConversaciones(conversaciones: Conversacion[]): Conversacion[] {
  return [...conversaciones].sort(
    (a, b) => new Date(b.ultimo_mensaje_at).getTime() - new Date(a.ultimo_mensaje_at).getTime()
  )
}

export function esMiMensaje(mensaje: Mensaje, miId: string): boolean {
  return mensaje.remitente_id === miId
}

export function agruparMensajesPorFecha(mensajes: Mensaje[]): { fecha: string; mensajes: Mensaje[] }[] {
  const grupos: { fecha: string; mensajes: Mensaje[] }[] = []
  let fechaActual = ''

  for (const msg of mensajes) {
    const fecha = new Date(msg.created_at).toLocaleDateString('es-VE', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    if (fecha !== fechaActual) {
      fechaActual = fecha
      grupos.push({ fecha, mensajes: [msg] })
    } else {
      grupos[grupos.length - 1].mensajes.push(msg)
    }
  }

  return grupos
}
