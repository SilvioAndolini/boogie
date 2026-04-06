// Esquemas de validación Zod para la aplicación Boogie

import { z } from 'zod'

// === Autenticación ===
export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  telefono: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const recuperacionSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})

// === Propiedades ===
export const propiedadSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  descripcion: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000),
  tipoPropiedad: z.enum([
    'APARTAMENTO', 'CASA', 'VILLA', 'CABANA', 'ESTUDIO',
    'HABITACION', 'LOFT', 'PENTHOUSE', 'FINCA', 'OTRO'
  ]),
  precioPorNoche: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  moneda: z.enum(['USD', 'VES']).default('USD'),
  capacidadMaxima: z.coerce.number().min(1, 'Debe alojar al menos 1 persona').max(20),
  habitaciones: z.coerce.number().min(0).default(1),
  banos: z.coerce.number().min(1).default(1),
  camas: z.coerce.number().min(1).default(1),
  direccion: z.string().min(5, 'La dirección es requerida'),
  ciudad: z.string().min(2, 'La ciudad es requerida'),
  estado: z.string().min(2, 'El estado es requerido'),
  zona: z.string().optional(),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  reglas: z.string().optional(),
  politicaCancelacion: z.enum(['FLEXIBLE', 'MODERADA', 'ESTRICTA']).default('MODERADA'),
  horarioCheckIn: z.string().default('14:00'),
  horarioCheckOut: z.string().default('11:00'),
  estanciaMinima: z.coerce.number().min(1).default(1),
  estanciaMaxima: z.coerce.number().optional(),
  amenidades: z.array(z.string()).default([]),
})

// === Reservas ===
export const reservaSchema = z.object({
  propiedadId: z.string(),
  fechaEntrada: z.coerce.date(),
  fechaSalida: z.coerce.date(),
  cantidadHuespedes: z.coerce.number().min(1).max(20),
  notasHuesped: z.string().optional(),
}).refine((data) => data.fechaSalida > data.fechaEntrada, {
  message: 'La fecha de salida debe ser posterior a la de entrada',
  path: ['fechaSalida'],
})

// === Pagos ===
export const pagoSchema = z.object({
  reservaId: z.string(),
  metodoPago: z.enum([
    'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE',
    'EFECTIVO_FARMATODO', 'USDT', 'TARJETA_INTERNACIONAL', 'EFECTIVO'
  ]),
  referencia: z.string().optional(),
  monto: z.coerce.number().min(1),
  moneda: z.enum(['USD', 'VES']).default('USD'),
})

// === Reseñas ===
export const resenaSchema = z.object({
  calificacion: z.coerce.number().min(1).max(5),
  limpieza: z.coerce.number().min(1).max(5).optional(),
  comunicacion: z.coerce.number().min(1).max(5).optional(),
  ubicacion: z.coerce.number().min(1).max(5).optional(),
  valor: z.coerce.number().min(1).max(5).optional(),
  comentario: z.string().min(10, 'El comentario debe tener al menos 10 caracteres').max(1000),
})

// === Perfil ===
export const perfilSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  telefono: z.string().optional(),
  bio: z.string().max(500).optional(),
})

// Tipos inferidos de los esquemas
export type RegistroInput = z.infer<typeof registroSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PropiedadInput = z.infer<typeof propiedadSchema>
export type ReservaInput = z.infer<typeof reservaSchema>
export type PagoInput = z.infer<typeof pagoSchema>
export type ResenaInput = z.infer<typeof resenaSchema>
export type PerfilInput = z.infer<typeof perfilSchema>
