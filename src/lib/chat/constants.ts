import { TipoMensajeRapido } from '@/types/chat'

export const QUICK_MESSAGES_DEFAULTS_ANFITRION: { contenido: string; tipo: TipoMensajeRapido }[] = [
  { contenido: '¡Gracias por tu interés! Te confirmo disponibilidad.', tipo: 'ambos' },
  { contenido: 'El check-in es a las 14:00 y el check-out a las 11:00.', tipo: 'ambos' },
  { contenido: 'La dirección exacta te la envío 24h antes de tu llegada.', tipo: 'ambos' },
  { contenido: '¿Necesitas transporte desde el aeropuerto? Puedo ayudarte.', tipo: 'ambos' },
  { contenido: '¡Tu reserva está confirmada! Te espero.', tipo: 'ambos' },
  { contenido: 'Estoy disponible para cualquier duda.', tipo: 'ambos' },
]

export const QUICK_MESSAGES_DEFAULTS_BOOGER: { contenido: string; tipo: TipoMensajeRapido }[] = [
  { contenido: '¿Tienen disponibilidad para estas fechas?', tipo: 'ambos' },
  { contenido: '¿Cuál es la dirección exacta del alojamiento?', tipo: 'ambos' },
  { contenido: '¿Ofrecen servicio de transporte?', tipo: 'ambos' },
  { contenido: '¿Se admiten mascotas?', tipo: 'ambos' },
  { contenido: '¿Hay estacionamiento disponible?', tipo: 'ambos' },
  { contenido: '¡Gracias! Confirmo recepción de la información.', tipo: 'ambos' },
]

export const CHAT_REALTIME_CHANNEL = 'chat'
export const MENSAJES_POR_PAGINA = 50
export const PREVIEW_MAX_LENGTH = 80
export const IMAGEN_CHAT_MAX_SIZE = 5 * 1024 * 1024
export const IMAGEN_CHAT_BUCKET = 'chat-imagenes'
