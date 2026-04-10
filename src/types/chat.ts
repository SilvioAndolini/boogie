export type TipoMensaje = 'texto' | 'imagen' | 'rapido'
export type TipoMensajeRapido = 'anfitrion' | 'booger' | 'ambos'

export interface Conversacion {
  id: string
  participante_1: string
  participante_2: string
  propiedad_id: string | null
  reserva_id: string | null
  ultimo_mensaje_at: string
  ultimo_mensaje_preview: string
  created_at: string
  updated_at: string
  otro_usuario?: {
    id: string
    nombre: string
    apellido: string
    avatar_url: string | null
  }
  propiedad?: {
    id: string
    titulo: string
  } | null
  no_leidos?: number
}

export interface Mensaje {
  id: string
  conversacion_id: string
  remitente_id: string
  contenido: string | null
  tipo: TipoMensaje
  imagen_url: string | null
  leido: boolean
  created_at: string
  remitente?: {
    id: string
    nombre: string
    apellido: string
    avatar_url: string | null
  }
}

export interface MensajeRapido {
  id: string
  usuario_id: string
  contenido: string
  tipo: TipoMensajeRapido
  orden: number
  activo: boolean
  created_at: string
}
