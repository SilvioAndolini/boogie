import { z } from 'zod'

export const crearOfertaSchema = z.object({
  propiedadId: z.string().min(1),
  fechaEntrada: z.coerce.date(),
  fechaSalida: z.coerce.date(),
  cantidadHuespedes: z.coerce.number().int().min(1).max(20),
  precioOfertado: z.coerce.number().positive('El precio debe ser mayor a 0'),
  moneda: z.enum(['USD', 'VES']).default('USD'),
  mensaje: z.string().max(500).optional(),
}).refine(
  (d) => d.fechaSalida > d.fechaEntrada,
  { message: 'La fecha de salida debe ser posterior a la entrada', path: ['fechaSalida'] }
).refine(
  (d) => d.fechaEntrada >= new Date(new Date().setHours(0, 0, 0, 0)),
  { message: 'No se pueden ofrecer fechas pasadas', path: ['fechaEntrada'] }
)

export const responderOfertaSchema = z.object({
  ofertaId: z.string().min(1),
  accion: z.enum(['ACEPTADA', 'RECHAZADA']),
  motivoRechazo: z.string().max(500).optional(),
})

export type CrearOfertaInput = z.infer<typeof crearOfertaSchema>
export type ResponderOfertaInput = z.infer<typeof responderOfertaSchema>
