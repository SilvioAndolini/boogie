import { z } from 'zod'

export const crearCuponSchema = z.object({
  codigo: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, guiones y guiones bajos'),
  nombre: z.string().min(3).max(100),
  descripcion: z.string().max(500).optional(),
  tipoDescuento: z.enum(['PORCENTAJE', 'MONTO_FIJO', 'NOCHES_GRATIS']),
  valorDescuento: z.coerce.number().positive('Debe ser mayor a 0'),
  moneda: z.enum(['USD', 'VES']).default('USD'),
  maxDescuento: z.coerce.number().positive().optional(),
  tipoAplicacion: z.enum([
    'PRIMERA_RESERVA', 'CUALQUIER_RESERVA', 'SOLO_ANFITRIONES', 'SOLO_HUESPEDES',
    'PROPIEDAD_ESPECIFICA', 'CIUDAD_ESPECIFICA', 'PLAN_ULTRA', 'RESERVA_MINIMA',
    'TEMPORADA_ALTA', 'TEMPORADA_BAJA', 'RESENA_POSITIVA', 'CUMPLEANERO',
    'USUARIO_NUEVO', 'USUARIO_ESPECIFICO',
  ]),
  valorAplicacion: z.string().optional(),
  minCompra: z.coerce.number().positive().optional(),
  minNoches: z.coerce.number().int().positive().optional(),
  maxUsos: z.coerce.number().int().positive().optional(),
  maxUsosPorUsuario: z.coerce.number().int().positive().default(1),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFin: z.string().min(1, 'Fecha de fin requerida'),
}).refine((data) => {
  if (data.tipoDescuento === 'PORCENTAJE' && data.valorDescuento > 100) return false
  return true
}, { message: 'El porcentaje no puede superar 100%', path: ['valorDescuento'] })
  .refine((data) => new Date(data.fechaFin) > new Date(data.fechaInicio), {
    message: 'La fecha de fin debe ser posterior a la de inicio',
    path: ['fechaFin'],
  })

export const editarCuponSchema = crearCuponSchema.partial().extend({
  id: z.string().min(1),
  activo: z.boolean().optional(),
})

export const comisionSchema = z.object({
  comisionHuesped: z.coerce.number().min(0).max(0.5, 'Máximo 50%'),
  comisionAnfitrion: z.coerce.number().min(0).max(0.5, 'Máximo 50%'),
})

export const validarCuponSchema = z.object({
  codigo: z.string().min(1),
  propiedadId: z.string().min(1),
  montoTotal: z.coerce.number().positive(),
  noches: z.coerce.number().int().positive(),
})

export const TIPOS_APLICACION_LABELS: Record<string, { label: string; descripcion: string; requiereValor: boolean }> = {
  PRIMERA_RESERVA: { label: 'Primera reserva', descripcion: 'Solo para usuarios con su primera reserva', requiereValor: false },
  CUALQUIER_RESERVA: { label: 'Cualquier reserva', descripcion: 'Aplica para todas las reservas', requiereValor: false },
  SOLO_ANFITRIONES: { label: 'Solo anfitriones', descripcion: 'Solo usuarios con rol anfitrión', requiereValor: false },
  SOLO_HUESPEDES: { label: 'Solo huéspedes', descripcion: 'Solo usuarios con rol booger/huésped', requiereValor: false },
  PROPIEDAD_ESPECIFICA: { label: 'Propiedad específica', descripcion: 'Solo para una propiedad en particular', requiereValor: true },
  CIUDAD_ESPECIFICA: { label: 'Ciudad específica', descripcion: 'Solo para propiedades en una ciudad', requiereValor: true },
  PLAN_ULTRA: { label: 'Plan ULTRA', descripcion: 'Solo para propiedades de anfitriones ULTRA', requiereValor: false },
  RESERVA_MINIMA: { label: 'Reserva mínima', descripcion: 'Requiere estancia mínima de noches', requiereValor: false },
  TEMPORADA_ALTA: { label: 'Temporada alta', descripcion: 'Fechas de temporada alta (dic-ene, semana santa)', requiereValor: false },
  TEMPORADA_BAJA: { label: 'Temporada baja', descripcion: 'Fechas fuera de temporada alta', requiereValor: false },
  RESENA_POSITIVA: { label: 'Reseña positiva', descripcion: 'Usuarios que dejaron reseñas con 4+ estrellas', requiereValor: false },
  CUMPLEANERO: { label: 'Cumpleañero', descripcion: 'Usuario con cumpleaños en el mes de la reserva', requiereValor: false },
  USUARIO_NUEVO: { label: 'Usuario nuevo', descripcion: 'Registrado en los últimos 30 días', requiereValor: false },
  USUARIO_ESPECIFICO: { label: 'Usuario específico', descripcion: 'Solo para un usuario en particular', requiereValor: true },
}

export const TIPOS_DESCUENTO_LABELS: Record<string, { label: string; descripcion: string }> = {
  PORCENTAJE: { label: 'Porcentaje', descripcion: 'Descuento porcentual sobre el total' },
  MONTO_FIJO: { label: 'Monto fijo', descripcion: 'Descuento de monto fijo en la moneda seleccionada' },
  NOCHES_GRATIS: { label: 'Noches gratis', descripcion: 'Número de noches sin costo' },
}
