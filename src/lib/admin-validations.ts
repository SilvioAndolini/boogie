import { z } from 'zod'

export const adminRevisarVerificacionSchema = z.object({
  verificacionId: z.string().min(1, 'ID de verificación requerido'),
  accion: z.enum(['APROBADA', 'RECHAZADA'], { error: 'Acción inválida' }),
  motivoRechazo: z.string().max(500, 'Máximo 500 caracteres').optional(),
}).refine(
  (data) => data.accion !== 'RECHAZADA' || (data.motivoRechazo && data.motivoRechazo.length >= 5),
  { message: 'El motivo de rechazo es obligatorio (mínimo 5 caracteres)', path: ['motivoRechazo'] }
)

export const adminActualizarRolSchema = z.object({
  usuarioId: z.string().min(1, 'ID de usuario requerido'),
  rol: z.enum(['HUESPED', 'ANFITRION', 'AMBOS', 'ADMIN'], { error: 'Rol inválido' }).optional(),
  activo: z.enum(['true', 'false'], { error: 'Valor inválido' }).optional(),
}).refine(
  (data) => data.rol !== undefined || data.activo !== undefined,
  { message: 'Debe especificar al menos un cambio' }
)

export const adminSuspenderUsuarioSchema = z.object({
  usuarioId: z.string().min(1),
  activo: z.boolean(),
  motivo: z.string().max(300).optional(),
})

export const adminActualizarPropiedadSchema = z.object({
  propiedadId: z.string().min(1, 'ID de propiedad requerido'),
  estadoPublicacion: z.enum(['BORRADOR', 'PENDIENTE_REVISION', 'PUBLICADA', 'PAUSADA', 'SUSPENDIDA']).optional(),
  destacada: z.boolean().optional(),
  motivo: z.string().max(500).optional(),
})

export const adminActualizarReservaSchema = z.object({
  reservaId: z.string().min(1, 'ID de reserva requerido'),
  accion: z.enum(['confirmar', 'rechazar', 'cancelar'], { error: 'Acción inválida' }),
  motivo: z.string().max(500).optional(),
})

export const adminVerificarPagoSchema = z.object({
  pagoId: z.string().min(1, 'ID de pago requerido'),
  accion: z.enum(['VERIFICADO', 'ACREDITADO', 'RECHAZADO'], { error: 'Acción inválida' }),
  notasVerificacion: z.string().max(500).optional(),
})

export const adminModerarResenaSchema = z.object({
  resenaId: z.string().min(1, 'ID de reseña requerido'),
  accion: z.enum(['ocultar', 'eliminar', 'mostrar'], { error: 'Acción inválida' }),
  motivo: z.string().max(500).optional(),
})

export const adminNotificacionSchema = z.object({
  usuarioId: z.string().optional(),
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100),
  mensaje: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres').max(2000),
  urlAccion: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const adminRegistroUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  tipoDocumento: z.enum(['CEDULA', 'PASAPORTE'], { error: 'Selecciona un tipo de documento' }),
  numeroDocumento: z.string().min(4, 'Ingresa el número de documento'),
  telefono: z.string().min(7, 'Ingresa un número de teléfono válido'),
  codigoPais: z.string().min(1),
  rol: z.enum(['HUESPED', 'ANFITRION', 'AMBOS', 'ADMIN'], { error: 'Selecciona un rol' }).default('HUESPED'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.tipoDocumento === 'CEDULA') {
    return /^[VEPGJ]\-\d{4,9}$/.test(data.numeroDocumento) || /^\d{4,9}$/.test(data.numeroDocumento)
  }
  return /^[A-Z0-9]{5,20}$/.test(data.numeroDocumento)
}, {
  message: 'Formato de documento inválido',
  path: ['numeroDocumento'],
})

export const adminAuditFilterSchema = z.object({
  adminId: z.string().optional(),
  entidad: z.enum(['usuario', 'propiedad', 'reserva', 'pago', 'verificacion', 'wallet', 'resena', 'notificacion', 'configuracion']).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(50),
})

export type AdminRevisarVerificacionInput = z.infer<typeof adminRevisarVerificacionSchema>
export type AdminActualizarRolInput = z.infer<typeof adminActualizarRolSchema>
export type AdminSuspenderUsuarioInput = z.infer<typeof adminSuspenderUsuarioSchema>
export type AdminActualizarPropiedadInput = z.infer<typeof adminActualizarPropiedadSchema>
export type AdminActualizarReservaInput = z.infer<typeof adminActualizarReservaSchema>
export type AdminVerificarPagoInput = z.infer<typeof adminVerificarPagoSchema>
export type AdminModerarResenaInput = z.infer<typeof adminModerarResenaSchema>
export type AdminNotificacionInput = z.infer<typeof adminNotificacionSchema>
export type AdminRegistroUsuarioInput = z.infer<typeof adminRegistroUsuarioSchema>
export type AdminAuditFilterInput = z.infer<typeof adminAuditFilterSchema>
