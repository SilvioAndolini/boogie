# SPEC: Sistema Completo de Reservas - Boogie

**Fecha:** 6 de Abril de 2026  
**Versión:** 1.0  
**Estado:** Para Implementación

---

## TABLA DE CONTENIDOS

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Casos de Uso Completos](#2-casos-de-uso-completos)
3. [Diagrama de Estados](#3-diagrama-de-estados)
4. [Validaciones Exhaustivas](#4-validaciones-exhaustivas)
5. [Políticas y Términos y Condiciones](#5-políticas-y-términos-y-condiciones)
6. [Control de Errores](#6-control-de-errores)
7. [Seguridad](#7-seguridad)
8. [Arquitectura de Implementación](#8-arquitectura-de-implementación)
9. [API Contract](#9-api-contract)
10. [Plan de Implementación](#10-plan-de-implementación)
11. [Testing Plan](#11-testing-plan)

---

## 1. VISIÓN GENERAL DEL SISTEMA

### 1.1 Objetivo

Implementar un sistema de reservas robusto, seguro y completo para la plataforma de alquiler vacacional Boogie en Venezuela, que maneje todo el ciclo de vida de una reserva desde la creación hasta la completación o cancelación, incluyendo validación exhaustiva, políticas de cancelación transparentes y protección contra race conditions.

### 1.2 Scope

**Incluido:**
- Creación de reservas con validación completa
- Verificación de disponibilidad en tiempo real
- Sistema de pagos manual con verificación
- Políticas de cancelación automáticas
- Notificaciones de estado
- Historial de reservas para huéspedes y anfitriones
- Cálculo automático de precios y comisiones
- Protección contra race conditions

**Excluido (v1.0):**
- Pagos automáticos con pasarelas (Stripe, etc.)
- Notificaciones por email/push en tiempo real
- Sistema de mensajes entre usuarios
- KYC/Verificación de identidad
- Insurance de reservas

### 1.3 Supuestos

1. La moneda principal es USD, con posibilidad de mostrar precios en VES
2. El mercado inicial es Venezuela
3. Los pagos se verifican manualmente por el anfitrión
4. No hay múltiples monedas en una misma reserva
5. Las fechas se manejan en UTC internally, se muestran en locale del usuario

---

## 2. CASOS DE USO COMPLETOS

### 2.1 Casos de Uso Primarios

#### UC-01: Crear Reserva Exitosa
**Actor:** Huésped autenticado  
**Precondiciones:**
- Usuario autenticado
- Propiedad existe y está PUBLICADA
- Fechas seleccionadas son válidas
- Capacidad disponible para el número de huéspedes

**Flujo Principal:**
1. Usuario selecciona propiedad
2. Sistema muestra calendario con disponibilidad
3. Usuario selecciona fecha de entrada
4. Usuario selecciona fecha de salida
5. Sistema valida que fecha salida > fecha entrada
6. Sistema calcula noches automáticamente
7. Usuario ingresa número de huéspedes
8. Sistema valida capacidad máxima
9. Sistema muestra desglose de precios
10. Sistema muestra política de cancelación aplicable
11. Usuario confirma la reserva
12. Sistema verifica disponibilidad atómicamente
13. Sistema crea reserva en estado PENDIENTE
14. Sistema crea registro de pago en estado PENDIENTE
15. Sistema envía notificación al anfitrión
16. Sistema envía confirmación al huésped
17. Sistema redirige a página de pago

**Postcondiciones:**
- Reserva creada en BD
- Pago registrado
- Notificaciones enviadas
- Anfitrión puede ver la reserva

#### UC-02: Reserva Fallida por Conflicto de Fechas
**Actor:** Huésped autenticado  
**Precondiciones:** Iguales a UC-01, pero otro usuario ya reservó esas fechas

**Flujo Alternativo:**
1-11. Same as UC-01
12. Sistema ejecuta transacción de verificación
13. La transacción detecta conflicto (fechas no disponibles)
14. Sistema rechaza la creación
15. Sistema muestra mensaje: "Las fechas seleccionadas ya no están disponibles"
16. Sistema sugiere fechas alternativas (próximas disponibles)

#### UC-03: Cancelación por Huésped
**Actor:** Huésped autenticado  
**Precondiciones:**
- Reserva existe
- Reserva está en estado PENDIENTE o CONFIRMADA
- El huésped es el propietario de la reserva

**Flujo Principal:**
1. Usuario accede a sus reservas
2. Selecciona la reserva a cancelar
3. Sistema muestra política de cancelación aplicable
4. Sistema calcula reembolso potencial
5. Usuario confirma cancelación
6. Sistema actualiza estado a CANCELADA_HUESPED
7. Sistema registra fecha de cancelación
8. Si aplica, sistema programa reembolso
9. Sistema notifica al anfitrión
10. Sistema envía confirmación al huésped

#### UC-04: Confirmación por Anfitrión
**Actor:** Anfitrión autenticado  
**Precondiciones:**
- Reserva existe
- Reserva está en estado PENDIENTE
- El anfitrión es el propietario de la propiedad

**Flujo Principal:**
1. Anfitrión accede a reservas recibidas
2. Ve nueva reserva con estado PENDIENTE
3. Anfitrión revisa detalles del huésped
4. Anfitrión decide confirmar o rechazar
5. Si confirma: Sistema actualiza estado a CONFIRMADA
6. Si rechaza: Sistema pide motivo (opcional)
7. Sistema actualiza estado a RECHAZADA
8. Sistema notifica al huésped
9. Si rechazada, sistema libera fechas

#### UC-05: Verificación de Pago
**Actor:** Anfitrión autenticado  
**Precondiciones:**
- Reserva en estado PENDIENTE o EN_VERIFICACION
- Pago registrado por el huésped
- El anfitrión es propietario de la propiedad

**Flujo Principal:**
1. Anfitrión ve reserva con pago pendiente de verificación
2. Revisa comprobante de pago
3. Valida que el monto coincide con referencia
4. Puede aprobar o rechazar
5. Si aprueba:
   - Sistema actualiza pago a VERIFICADO
   - Sistema confirma la reserva
   - Sistema notifica al huésped
6. Si rechaza:
   - Sistema actualiza pago a RECHAZADO
   - Sistema pide motivo
   - Sistema notifica al huésped para reenviar comprobante

### 2.2 Casos de Uso Secundarios

#### UC-06: Modificación de Fechas (No en v1.0)
*Nota: Este caso se maneja como cancelación + nueva reserva*

#### UC-07: Reserva como Invitado (No en v1.0)
*Nota: Todos los usuarios deben estar autenticados*

#### UC-08: Checkout Automático
**Actor:** Sistema (cron job)  
**Precondiciones:**
- Reserva en estado CONFIRMADA
- Fecha de salida == hoy

**Flujo:**
1. Cron job ejecuta diariamente a las 11:00 AM
2. Sistema busca reservas con fechaSalida == hoy y estado CONFIRMADA
3. Para cada reserva:
   - Actualiza estado a COMPLETADA
   - Notifica al huésped para dejar reseña
   - Notifica al anfitrión para preparar propiedad

#### UC-09: Check-in Automático
**Actor:** Sistema (cron job)  
**Precondiciones:**
- Reserva en estado CONFIRMADA
- Fecha de entrada == hoy

**Flujo:**
1. Cron job ejecuta diariamente a las 14:00 (horario check-in)
2. Sistema busca reservas con fechaEntrada == hoy y estado CONFIRMADA
3. Para cada reserva:
   - Actualiza estado a EN_CURSO
   - Notifica al huésped con instrucciones
   - Notifica al anfitrión

### 2.3 Casos de Uso de Error

#### UC-10: Intento de Reserva con Fechas Pasadas
**Actor:** Huésped  
**Flujo de Error:**
1. Usuario intenta seleccionar fecha de entrada pasada
2. Sistema deshabilita fechas pasadas en el calendario
3. Si intenta manipular fecha via API:
   - Sistema valida en servidor: `fechaEntrada >= hoy`
   - Sistema rechaza con error 400
   - Retorna: "No se pueden realizar reservas con fechas pasadas"

#### UC-11: Intento de Reserva con Capacidad Excedida
**Actor:** Huésped  
**Flujo de Error:**
1. Usuario selecciona número de huéspedes > capacidadMaxima
2. Sistema muestra error: "La capacidad máxima es X huéspedes"
3. Si intenta manipular via API:
   - Validación en servidor rechaza
   - Retorna: "El número de huéspedes excede la capacidad máxima"

#### UC-12: Intento de Reserva con Estancia Inválida
**Actor:** Huésped  
**Flujo de Error:**
1. Usuario selecciona noches < estanciaMinima
2. Sistema muestra: "Estancia mínima de X noches"
3. Usuario selecciona noches > estanciaMaxima (si está configurado)
4. Sistema muestra: "Estancia máxima de X noches"

#### UC-13: Pago con Monto Incorrecto
**Actor:** Huésped  
**Flujo de Error:**
1. Huésped registra pago con monto diferente al total
2. Sistema valida: `montoPago == totalReserva`
3. Si no coincide: Error "El monto debe ser exactamente X USD"

#### UC-14: Double Booking Prevention
**Actor:** Sistema  
**Flujo de Error:**
1. Dos usuarios intentan reservar las mismas fechas simultáneamente
2. Sistema usa transacción con locking
3. Primer usuario obtiene lock y completa
4. Segundo usuario recibe error: "Las fechas ya no están disponibles"

#### UC-15: Pago Duplicado
**Actor:** Huésped  
**Flujo de Error:**
1. Usuario intenta registrar segundo pago para misma reserva
2. Sistema verifica: `reserva.pagos.length > 0`
3. Si ya existe pago en estado PENDIENTE o VERIFICADO:
   - Rechaza segundo pago
   - Retorna: "Ya existe un pago registrado para esta reserva"

---

## 3. DIAGRAMA DE ESTADOS

### 3.1 Estados de Reserva

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    ▼                                                         │
    ┌───────────┐    │    ┌────────────┐    ┌───────────┐    ┌───────────┐   │
    │ PENDIENTE │────┴───▶│ CONFIRMADA │───▶│ EN_CURSO  │───▶│ COMPLETADA│   │
    └───────────┘         └────────────┘    └───────────┘    └───────────┘   │
         │                     │                                       ▲     │
         │                     │                                       │     │
         │                     │              ┌──────────────┐         │     │
         │                     │              │ CANCELADA_   │─────────┘     │
         │                     ▼              │ HUESPED      │               │
         │              ┌────────────┐       └──────────────┘               │
         └─────────────▶│  RECHAZADA │                                       │
                        └────────────┘                                       │
                                                                            │
                    ┌──────────────┐                                        │
                    │ CANCELADA_   │────────────────────────────────────────┘
                    │ ANFITRION    │
                    └──────────────┘
```

### 3.2 Estados de Pago

```
    ┌────────────┐    ┌─────────────────┐    ┌───────────┐    ┌───────────┐
    │  PENDIENTE │───▶│  EN_VERIFICACION │───▶│ VERIFICADO│───▶│ ACREDITADO│
    └────────────┘    └─────────────────┘    └───────────┘    └───────────┘
         │                     │
         │                     │
         ▼                     ▼
    ┌──────────┐         ┌──────────┐
    │ RECHAZADO│         │REEMBOLSADO│
    └──────────┘         └──────────┘
```

### 3.3 Transiciones de Estado - Tabla de Validación

| Estado Actual | Evento | Estado Siguiente | Condiciones | Acción Adjunta |
|---------------|--------|------------------|------------|---------------|
| PENDIENTE | Confirmar (anfitrión) | CONFIRMADA | Es anfitrión + pago verificado | Notificar huésped |
| PENDIENTE | Rechazar (anfitrión) | RECHAZADA | Es anfitrión | Liberar fechas, notificar |
| PENDIENTE | Cancelar (huésped) | CANCELADA_HUESPED | Es huésped | Calcular reembolso |
| PENDIENTE | Timeout (24h) | CANCELADA_HUESPED | Sin pago | Notificar, liberar fechas |
| CONFIRMADA | Fecha entrada = hoy | EN_CURSO | Auto (cron) | Notificar ambos |
| CONFIRMADA | Cancelar (anfitrión) | CANCELADA_ANFITRION | Es anfitrión | Reembolso total, notificar |
| CONFIRMADA | Cancelar (huésped) | CANCELADA_HUESPED | Es huésped | Aplicar política |
| EN_CURSO | Fecha salida = hoy | COMPLETADA | Auto (cron) | Notificar reseña |
| VERIFICADO | Acreditación | ACREDITADO | Manual | Confirmar fondods |

---

## 4. VALIDACIONES EXHAUSTIVAS

### 4.1 Validaciones de Entrada (Input Validation)

#### 4.1.1 Schema Zod - Reserva

```typescript
// En src/lib/validations.ts - NUEVO SCHEMA COMPLETO

export const crearReservaSchema = z.object({
  propiedadId: z.string().cuid("ID de propiedad inválido"),
  fechaEntrada: z.coerce.date({
    required_error: "La fecha de entrada es requerida",
    invalid_type_error: "Fecha de entrada inválida"
  }),
  fechaSalida: z.coerce.date({
    required_error: "La fecha de salida es requerida",
    invalid_type_error: "Fecha de salida inválida"
  }),
  cantidadHuespedes: z.coerce.number({
    required_error: "El número de huéspedes es requerido",
    invalid_type_error: "Número de huéspedes inválido"
  }).int("El número de huéspedes debe ser un entero")
    .min(1, "Debe haber al menos 1 huésped")
    .max(20, "Máximo 20 huéspedes"),
  notasHuesped: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres").optional(),
}).refine(
  (data) => data.fechaEntrada >= new Date(new Date().setHours(0, 0, 0, 0)),
  {
    message: "No se pueden reservar fechas pasadas",
    path: ["fechaEntrada"]
  }
).refine(
  (data) => data.fechaSalida > data.fechaEntrada,
  {
    message: "La fecha de salida debe ser posterior a la fecha de entrada",
    path: ["fechaSalida"]
  }
).refine(
  (data) => {
    const diffTime = data.fechaSalida.getTime() - data.fechaEntrada.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 1 && diffDays <= 365 // Máximo 1 año
  },
  {
    message: "La estancia debe ser entre 1 y 365 noches",
    path: ["fechaSalida"]
  }
)
```

#### 4.1.2 Validaciones de Capacidad

```typescript
// En src/lib/validations.ts - Función de validación de capacidad

export function validarCapacidadReserva(
  cantidadHuespedes: number,
  capacidadMaxima: number
): ValidationResult {
  if (cantidadHuespedes < 1) {
    return {
      valido: false,
      error: "Debe haber al menos 1 huésped"
    }
  }
  
  if (cantidadHuespedes > capacidadMaxima) {
    return {
      valido: false,
      error: `La capacidad máxima de esta propiedad es de ${capacidadMaxima} huéspedes`
    }
  }
  
  return { valido: true }
}
```

#### 4.1.3 Validaciones de Estancia

```typescript
// En src/lib/validations.ts - Función de validación de estancia

export function validarEstanciaReserva(
  noches: number,
  estanciaMinima: number,
  estanciaMaxima: number | null
): ValidationResult {
  if (noches < estanciaMinima) {
    return {
      valido: false,
      error: `La estancia mínima es de ${estanciaMinima} noche${estanciaMinima > 1 ? 's' : ''}`
    }
  }
  
  if (estanciaMaxima !== null && noches > estanciaMaxima) {
    return {
      valido: false,
      error: `La estancia máxima es de ${estanciaMaxima} noches`
    }
  }
  
  return { valido: true }
}
```

### 4.2 Validaciones de Negocio (Business Rules)

#### 4.2.1 Disponibilidad

```typescript
// En src/lib/validations.ts - Verificación de disponibilidad

interface VerificacionDisponibilidad {
  disponible: boolean
  conflicto?: {
    tipo: 'RESERVA_EXISTENTE' | 'FECHA_BLOQUEADA' | 'PRECIO_ESPECIAL'
    reservaId?: string
    fechaBloqueadaId?: string
    precioEspecial?: {
      nombre: string
      precioPorNoche: number
    }
  }
}

export async function verificarDisponibilidad(
  propiedadId: string,
  fechaEntrada: Date,
  fechaSalida: Date,
  tx?: Prisma.TransactionClient // Para transacciones
): Promise<VerificacionDisponibilidad> {
  const client = tx || prisma
  
  // 1. Verificar reservas existentes
  const reservasConflicto = await client.reserva.findFirst({
    where: {
      propiedadId,
      estado: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
      fechaEntrada: { lt: fechaSalida },
      fechaSalida: { gt: fechaEntrada }
    }
  })
  
  if (reservasConflicto) {
    return {
      disponible: false,
      conflicto: {
        tipo: 'RESERVA_EXISTENTE',
        reservaId: reservasConflicto.id
      }
    }
  }
  
  // 2. Verificar fechas bloqueadas
  const fechaBloqueada = await client.fechaBloqueada.findFirst({
    where: {
      propiedadId,
      fechaInicio: { lt: fechaSalida },
      fechaFin: { gt: fechaEntrada }
    }
  })
  
  if (fechaBloqueada) {
    return {
      disponible: false,
      conflicto: {
        tipo: 'FECHA_BLOQUEADA',
        fechaBloqueadaId: fechaBloqueada.id
      }
    }
  }
  
  return { disponible: true }
}
```

#### 4.2.2 Validación de Precio Especial

```typescript
// En src/lib/validations.ts - Obtener precio para fechas

export async function obtenerPrecioParaFechas(
  propiedadId: string,
  fechaEntrada: Date,
  fechaSalida: Date,
  precioBase: Decimal
): Promise<{
  noches: number
  desglose: {
    fecha: Date
    precio: number
    tipo: 'BASE' | 'ESPECIAL'
    nombre?: string
  }[]
  subtotal: number
}> {
  const noches = calcularNoches(fechaEntrada, fechaSalida)
  const desglose: DesgloseNoche[] = []
  
  // Obtener precios especiales en el rango
  const preciosEspeciales = await prisma.precioEspecial.findMany({
    where: {
      propiedadId,
      fechaInicio: { lte: fechaSalida },
      fechaFin: { gte: fechaEntrada }
    }
  })
  
  // Para cada noche, determinar el precio
  let currentDate = new Date(fechaEntrada)
  let subtotal = 0
  
  for (let i = 0; i < noches; i++) {
    const precioEspecial = preciosEspeciales.find(p => 
      currentDate >= p.fechaInicio && currentDate <= p.fechaFin
    )
    
    const precioNoche = precioEspecial 
      ? Number(precioEspecial.precioPorNoche)
      : Number(precioBase)
    
    desglose.push({
      fecha: new Date(currentDate),
      precio: precioNoche,
      tipo: precioEspecial ? 'ESPECIAL' : 'BASE',
      nombre: precioEspecial?.nombre
    })
    
    subtotal += precioNoche
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return { noches, desglose, subtotal }
}
```

### 4.3 Validaciones de Seguridad

#### 4.3.1 Verificación de Propietario

```typescript
// En src/lib/validations.ts

export async function verificarPropietarioPropiedad(
  propiedadId: string,
  usuarioId: string,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || prisma
  
  const propiedad = await client.propiedad.findFirst({
    where: {
      id: propiedadId,
      propietarioId: usuarioId
    }
  })
  
  return propiedad !== null
}

export async function verificarPropietarioReserva(
  reservaId: string,
  usuarioId: string,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || prisma
  
  const reserva = await client.reserva.findFirst({
    where: {
      id: reservaId,
      propiedad: {
        propietarioId: usuarioId
      }
    }
  })
  
  return reserva !== null
}
```

#### 4.3.2 Verificación de Acceso a Reserva (Huésped)

```typescript
// En src/lib/validations.ts

export async function verificarHuespedReserva(
  reservaId: string,
  usuarioId: string,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || prisma
  
  const reserva = await client.reserva.findFirst({
    where: {
      id: reservaId,
      huespedId: usuarioId
    }
  })
  
  return reserva !== null
}
```

### 4.4 Validaciones de Estado

#### 4.4.1 Verificación de Estado para Transición

```typescript
// En src/lib/validations.ts

const TRANSICIONES_PERMITIDAS: Record<EstadoReserva, EstadoReserva[]> = {
  PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA_HUESPED'],
  CONFIRMADA: ['EN_CURSO', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION'],
  EN_CURSO: ['COMPLETADA'],
  COMPLETADA: [],
  CANCELADA_HUESPED: [],
  CANCELADA_ANFITRION: [],
  RECHAZADA: []
}

export function puedeTransicionar(
  estadoActual: EstadoReserva,
  estadoNuevo: EstadoReserva
): boolean {
  return TRANSICIONES_PERMITIDAS[estadoActual]?.includes(estadoNuevo) || false
}

export function obtenerErrorTransicion(
  estadoActual: EstadoReserva,
  estadoNuevo: EstadoReserva
): string {
  if (!puedeTransicionar(estadoActual, estadoNuevo)) {
    return `No es posible cambiar del estado '${estadoActual}' al estado '${estadoNuevo}'`
  }
  return ''
}
```

---

## 5. POLÍTICAS Y TÉRMINOS Y CONDICIONES

### 5.1 Política de Cancelación

#### 5.1.1 Términos y Condiciones - Cancelación

```
POLÍTICA DE CANCELACIÓN DE BOOGIE

1. POLÍTICAS DISPONIBLES

1.1 Política Flexible
- Cancelación gratuita hasta 24 horas antes del check-in (14:00 hora local)
- Reembolso del 100% si cancela más de 24 horas antes
- Sin reembolso si cancela dentro de las 24 horas previas

1.2 Política Moderada
- Cancelación gratuita hasta 5 días antes del check-in
- Reembolso del 100% si cancela más de 5 días antes
- Reembolso del 50% si cancela entre 1-5 días antes
- Sin reembolso si cancela el día del check-in

1.3 Política Estricta
- Cancelación gratuita hasta 14 días antes del check-in
- Reembolso del 100% si cancela más de 14 días antes
- Reembolso del 50% si cancela entre 7-14 días antes
- Sin reembolso si cancela dentro de los 7 días previos

2. CÁLCULO DEL REEMBOLSO

2.1 El reembolso se calcula sobre el TOTAL de la reserva (subtotal + comisión)

2.2 La comisión de servicio de Boogie (6%) no es reembolsable

2.3 Los reembolsos se procesan en un máximo de 5-10 días hábiles

2.4 El método de reembolso es el mismo utilizado para el pago

3. CANCELACIONES POR CIRCUNSTANCIAS EXTRAORDINARIAS

3.1 Fuerza Mayor: En casos de desastres naturales, emergencias gubernamentales
   u otras circunstancias fuera del control de las partes, se evaluarán
   reembolsos caso por caso

3.2 Enfermedad: Con documentación comprobable (certificado médico),
   se evaluará reembolso parcial o total

4. DERECHOS DEL ANFITRIÓN

4.1 El anfitrión puede cancelar una reserva confirmada solo por causa mayor
   u otra circunstancia extraordinaria

4.2 Si el anfitrión cancela, debe proporcionar alternativa equivalente
   o reembolso completo al huésped

4.3 Cancelaciones repetidas por parte del anfitrión pueden resultar en
   suspensión de la cuenta

5. NO-SHOW

5.1 Si el huésped no se presenta el día del check-in sin notificación,
   la reserva se considera cancelada sin reembolso
```

#### 5.1.2 Implementación de Cálculo de Reembolso

```typescript
// En src/lib/calculations.ts - Cálculo completo de reembolso

interface CalculoReembolso {
  totalReserva: number
  comisionPlataforma: number
  montoReembolsable: number
  montoNoReembolsable: number
  porcentajeReembolso: number
  politicaAplicable: PoliticaCancelacion
  diasAntesCheckIn: number
  mensaje: string
}

type PoliticaCancelacion = 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA'

export function calcularReembolsoCompleto(
  totalReserva: number,
  comisionPlataforma: number,
  politica: PoliticaCancelacion,
  fechaEntrada: Date
): CalculoReembolso {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const fechaCheckIn = new Date(fechaEntrada)
  fechaCheckIn.setHours(14, 0, 0, 0) // Hora de check-in: 14:00
  
  const diffTime = fechaCheckIn.getTime() - hoy.getTime()
  const diasAntes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let porcentajeReembolso = 0
  let montoReembolsable = 0
  const montoNoReembolsable = totalReserva
  
  switch (politica) {
    case 'FLEXIBLE':
      if (diasAntes >= 1) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      }
      break
      
    case 'MODERADA':
      if (diasAntes >= 5) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      } else if (diasAntes >= 1) {
        porcentajeReembolso = 50
        montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
      }
      break
      
    case 'ESTRICTA':
      if (diasAntes >= 14) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      } else if (diasAntes >= 7) {
        porcentajeReembolso = 50
        montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
      }
      break
  }
  
  // Asegurar que montoReembolsable no sea negativo
  montoReembolsable = Math.max(0, montoReembolsable)
  
  let mensaje = ''
  if (porcentajeReembolso === 100) {
    mensaje = `Reembolso completo de ${formatearMonto(montoReembolsable)}`
  } else if (porcentajeReembolso > 0) {
    mensaje = `Reembolso parcial del ${porcentajeReembolso}%: ${formatearMonto(montoReembolsable)}`
  } else {
    mensaje = 'No aplicable para reembolso según la política de cancelación'
  }
  
  return {
    totalReserva,
    comisionPlataforma,
    montoReembolsable,
    montoNoReembolsable: totalReserva - montoReembolsable,
    porcentajeReembolso,
    politicaAplicable: politica,
    diasAntesCheckIn: diasAntes,
    mensaje
  }
}
```

### 5.2 Términos y Condiciones Generales de Reservas

#### 5.2.1 Documento Completo

```
TÉRMINOS Y CONDICIONES DEL SERVICIO DE RESERVAS - BOOGIE

Última actualización: 6 de Abril de 2026

1. ACEPTACIÓN DE TÉRMINOS

1.1 Al utilizar el servicio de reservas de Boogie, usted (el "Usuario")
   acepta estos términos y condiciones en su totalidad.

1.2 Si no está de acuerdo con alguno de estos términos, no debe utilizar
   el servicio de reservas.

2. DEFINICIONES

2.1 "Boogie" o "nosotros": Plataforma de alquiler vacacional
2.2 "Usuario": Persona que utiliza la plataforma
2.3 "Huésped": Usuario que reserva una propiedad
2.4 "Anfitrión": Usuario que ofrece propiedades para alquiler
2.5 "Propiedad": Alojamiento listado en la plataforma
2.6 "Reserva": Contrato de alquiler por un período específico
2.7 "Check-in": Fecha y hora de entrada
2.8 "Check-out": Fecha y hora de salida

3. PROCESO DE RESERVA

3.1 BÚSQUEDA Y SELECCIÓN
   a) El Usuario puede buscar propiedades por ubicación, fechas y capacidad
   b) Las propiedades mostradas están disponibles según los filtros seleccionados

3.2 CONFIRMACIÓN DE RESERVA
   a) El Usuario selecciona fechas y número de huéspedes
   b) El Sistema muestra el precio total y la política de cancelación
   c) El Usuario confirma la reserva
   d) Se crea una reserva en estado PENDIENTE

3.3 PAGO
   a) El Usuario debe completar el pago dentro de las 24 horas siguientes
   b) Si no se recibe pago, la reserva se cancela automáticamente
   c) Los pagos se verifican manualmente por el Anfitrión

3.4 CONFIRMACIÓN
   a) Una vez verificado el pago, el Anfitrión confirma la reserva
   b) La reserva cambia a estado CONFIRMADA
   c) Se envía confirmación al Huésped

4. PRECIOS Y PAGOS

4.1 PRECIOS
   a) Los precios son por noche y en USD (a menos que se indique lo contrario)
   b) Los precios pueden variar según las fechas seleccionadas
   c) Precios especiales pueden aplicarse en temporadas altas

4.2 COMISIONES
   a) Comisión del Huésped: 6% del subtotal
   b) Comisión del Anfitrión: 3% del subtotal
   c) Estas comisiones están incluidas en el precio total mostrado

4.3 MÉTODOS DE PAGO ACEPTADOS
   a) Transferencia bancaria
   b) Pago Móvil (Venezuela)
   c) Zelle
   d) Efectivo en Farmatodo
   e) USDT (Tether)
   f) Tarjetas internacionales (con restricciones)

4.4 VERIFICACIÓN DE PAGO
   a) El Anfitrión tiene 24 horas para verificar el pago
   b) Si el pago es rechazado, el Huésped debe proporcionar comprobante
   c) El Huésped tiene 48 horas para proporcionar comprobante válido

5. POLÍTICA DE CANCELACIÓN (Ver sección 5.1)

6. DERECHOS Y OBLIGACIONES DEL HUÉSPED

6.1 DERECHOS
   a) Recibir la propiedad en las condiciones descritas
   b) Check-in en el horario establecido (14:00 por defecto)
   c) Check-out en el horario establecido (11:00 por defecto)
   d) Un reembolso según la política de cancelación aplicable

6.2 OBLIGACIONES
   a) Pagar el total de la reserva
   b) Proporcionar información veraz
   c) Respetar el número máximo de huéspedes
   d) Cumplir las reglas de la propiedad
   e) Mantener la propiedad en buen estado
   f) Abandonar la propiedad en la fecha de check-out

7. DERECHOS Y OBLIGACIONES DEL ANFITRIÓN

7.1 DERECHOS
   a) Recibir el pago por la estadía
   b) Establecer reglas de la propiedad
   c) Solicitar identificación del Huésped
   d) Cancelar reservas en circunstancias extraordinarias

7.2 OBLIGACIONES
   a) Proporcionar la propiedad en las condiciones prometidas
   b) Mantener la información actualizada
   c) Responder a las solicitudes de reserva
   d) Estar disponible para el check-in
   e) Verificar los pagos de manera oportuna

8. PROPIEDAD INTELECTUAL

8.1 Todo el contenido de la plataforma (fotos, descripciones, logos)
   es propiedad de Boogie o de los respective Anfitriones

8.2 Está prohibido usar el contenido sin autorización

9. LIMITACIÓN DE RESPONSABILIDAD

9.1 Boogie actúa como intermediario entre Huéspedes y Anfitriones

9.2 Boogie no es responsable por:
   a)Actos u omisiones de los Anfitriones
   b)Actos u omisiones de los Huéspedes
   c) Condiciones de las propiedades más allá de lo descrito
   d) Fuerza mayor

9.3 La responsabilidad máxima de Boogie está limitada al monto
   de las comisiones cobradas

10. PROTECCIÓN DE DATOS

10.1 Boogie protege los datos personales según la ley venezolana
    de protección de datos

10.2 Los datos de pago se procesan de forma segura

10.3 Verificar política de privacidad completa

11. MODIFICACIONES

11.1 Boogie puede modificar estos términos con previo aviso
    de 30 días

11.2 Las modificaciones no afectan reservas ya confirmadas

12. JURISDICCIÓN

12.1 Estos términos se rigen por las leyes de Venezuela

12.2 Cualquier disputa será resuelta en tribunales venezolanos

13. CONTACTO

Para preguntas sobre estos términos:
Email: legal@boogie.com.ve
```

### 5.3 Términos para Conflictos de Reservas

#### 5.3.1 Política de Conflictos

```
POLÍTICA DE RESOLUCIÓN DE CONFLICTOS DE RESERVAS - BOOGIE

1. PREVENCIÓN DE CONFLICTOS

1.1 Sistema de Bloqueo
   - Cuando un Usuario inicia el proceso de reserva, las fechas se "bloquean"
     por 15 minutos para ese Usuario
   - Otros Usuarios ven las fechas como "pendientes" (no disponibles)

1.2 Verificación Atómica
   - Todas las reservas se verifican dentro de una transacción de base de datos
   - Se usa locking pesimista para prevenir double-booking

1.3 Límite de Intentos
   - Máximo 3 intentos de reserva fallidos por hora por Usuario

2. EN CASO DE CONFLICTO (Double Booking)

2.1 Si trotz sistema ocurre un double booking:
   
   a) PRIMER CASO: Pago no procesado
      - Se cancela la reserva del segundo Usuario
      - Se reembolsa si ya pagó
      - El segundo Usuario recibe notificación inmediata

   b) SEGUNDO CASO: Pago ya acreditado
      - La primera reserva confirmada tiene prioridad
      - Al segundo Usuario se le reembolsa completamente
      - El Anfitrión debe proporcionar alternativa o compensar

2.2 Compensación
   - Si el Anfitrión es responsable del conflicto:
     * Reembolso completo al Huésped afectado
     * Compensación adicional del 10% del valor de la reserva
     * Penalización en la cuenta del Anfitrión

3. RESPONSABILIDADES

3.1 Responsabilidad de Boogie
   - Mantener sistemas de prevención actualizados
   - Resolver conflictos de manera justa
   - Procesar reembolsos rápidamente

3.2 Responsabilidad del Anfitrión
   - Mantener calendario actualizado
   - No confirmar reservas fuera de la plataforma
   - Resolver conflictos directamente con los afectados

3.3 Responsabilidad del Huésped
   - Verificar confirmaciones
   - Conservar comprobantes de pago
   - Reportar conflictos inmediatamente

4. PROCESO DE RECLAMACIÓN

4.1 Paso 1: Intentar resolución directa (24 horas)
4.2 Paso 2: Contactar a Boogie via soporte
4.3 Paso 3: Boogie mediana el conflicto (48 horas)
4.4 Paso 4: Decisión final de Boogie

5. HISTORIAL Y TRANSPARENCIA

5.1 Todos los conflictos se documentan
5.2 Los Anfitriones con múltiples conflictos pueden ser suspendidos
5.3 Se mantiene transparencia en las métricas de conflicto
```

---

## 6. CONTROL DE ERRORES

### 6.1 Taxonomía de Errores

#### 6.1.1 Categorías de Error

| Código | Categoría | Descripción | Ejemplo |
|--------|-----------|-------------|---------|
| ERR-001 | VALIDATION | Error de validación de entrada | Fecha inválida |
| ERR-002 | BUSINESS | Violación de regla de negocio | Capacidad excedida |
| ERR-003 | AVAILABILITY | Conflicto de disponibilidad | Double booking |
| ERR-004 | AUTH | Error de autenticación | No logueado |
| ERR-005 | PERMISSION | Sin permisos | No es el propietario |
| ERR-006 | STATE | Estado inválido para transición | Confirmar ya confirmada |
| ERR-007 | PAYMENT | Error relacionado con pago | Monto no coincide |
| ERR-008 | TIMEOUT | Operación expiró | Reserva pendientes > 24h |
| ERR-009 | CONCURRENCY | Error de concurrencia | Race condition |
| ERR-010 | SYSTEM | Error interno del sistema | Fallo de BD |

#### 6.1.2 Estructura de Error

```typescript
// En src/types/errors.ts - Definición de errores

interface AppError {
  codigo: string          // ERR-001, ERR-002, etc.
  mensaje: string         // Mensaje para el usuario (en español)
  detalle: string         // Detalle técnico (para logs)
  metadatos?: Record<string, unknown>  // Datos adicionales
  timestamp: string       // ISO timestamp
  requestId: string      // ID único de la request
  nivel: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
}

interface ErrorResponse {
  exito: false
  error: AppError
  // No incluir detalles técnicos en producción
  // Solo en desarrollo
}

function crearError(
  codigo: string,
  mensaje: string,
  detalle: string,
  nivel: AppError['nivel'] = 'ERROR',
  metadatos?: Record<string, unknown>
): AppError {
  return {
    codigo,
    mensaje,
    detalle,
    metadatos,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    nivel
  }
}
```

#### 6.1.3 Mapa de Errores

```typescript
// En src/lib/errors.ts - Constantes de errores

export const ERRORES = {
  // VALIDATION (ERR-001)
  FECHA_ENTRADA_INVALIDA: {
    codigo: 'ERR-001',
    mensaje: 'La fecha de entrada no es válida',
    nivel: 'WARN'
  },
  FECHA_SALIDA_INVALIDA: {
    codigo: 'ERR-001',
    mensaje: 'La fecha de salida no es válida',
    nivel: 'WARN'
  },
  FECHA_PASADA: {
    codigo: 'ERR-001',
    mensaje: 'No se pueden reservar fechas pasadas',
    nivel: 'WARN'
  },
  HUESPEDES_INVALIDOS: {
    codigo: 'ERR-001',
    mensaje: 'El número de huéspedes no es válido',
    nivel: 'WARN'
  },
  
  // BUSINESS (ERR-002)
  CAPACIDAD_EXCEDIDA: {
    codigo: 'ERR-002',
    mensaje: 'La capacidad máxima de la propiedad es de {capacidad} huéspedes',
    nivel: 'WARN'
  },
  ESTANCIA_MINIMA_NO_CUMPLIDA: {
    codigo: 'ERR-002',
    mensaje: 'La estancia mínima es de {minimo} noches',
    nivel: 'WARN'
  },
  ESTANCIA_MAXIMA_EXCEDIDA: {
    codigo: 'ERR-002',
    mensaje: 'La estancia máxima es de {maximo} noches',
    nivel: 'WARN'
  },
  NOCHES_INVALIDAS: {
    codigo: 'ERR-002',
    mensaje: 'La reserva debe ser de al menos 1 noche',
    nivel: 'WARN'
  },
  
  // AVAILABILITY (ERR-003)
  FECHAS_NO_DISPONIBLES: {
    codigo: 'ERR-003',
    mensaje: 'Las fechas seleccionadas ya no están disponibles',
    nivel: 'INFO'
  },
  RESERVA_EXISTENTE: {
    codigo: 'ERR-003',
    mensaje: 'Ya existe una reserva para estas fechas',
    nivel: 'INFO'
  },
  FECHA_BLOQUEADA: {
    codigo: 'ERR-003',
    mensaje: 'Las fechas seleccionadas están bloqueadas',
    nivel: 'INFO'
  },
  
  // AUTH (ERR-004)
  NO_AUTENTICADO: {
    codigo: 'ERR-004',
    mensaje: 'Debes iniciar sesión para continuar',
    nivel: 'WARN'
  },
  SESION_EXPIRADA: {
    codigo: 'ERR-004',
    mensaje: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
    nivel: 'WARN'
  },
  
  // PERMISSION (ERR-005)
  NO_PROPIETARIO: {
    codigo: 'ERR-005',
    mensaje: 'No tienes permisos para realizar esta acción',
    nivel: 'WARN'
  },
  NO_ANFITRION: {
    codigo: 'ERR-005',
    mensaje: 'Solo el anfitrión puede realizar esta acción',
    nivel: 'WARN'
  },
  
  // STATE (ERR-006)
  ESTADO_INVALIDO: {
    codigo: 'ERR-006',
    mensaje: 'No es posible realizar esta acción en el estado actual de la reserva',
    nivel: 'WARN'
  },
  RESERVA_PENDIENTE: {
    codigo: 'ERR-006',
    mensaje: 'Esta reserva aún está pendiente de confirmación',
    nivel: 'INFO'
  },
  RESERVA_YA_CONFIRMADA: {
    codigo: 'ERR-006',
    mensaje: 'Esta reserva ya ha sido confirmada',
    nivel: 'INFO'
  },
  RESERVA_CANCELADA: {
    codigo: 'ERR-006',
    mensaje: 'Esta reserva ha sido cancelada',
    nivel: 'INFO'
  },
  RESERVA_COMPLETADA: {
    codigo: 'ERR-006',
    mensaje: 'Esta reserva ya ha sido completada',
    nivel: 'INFO'
  },
  
  // PAYMENT (ERR-007)
  MONTO_INCORRECTO: {
    codigo: 'ERR-007',
    mensaje: 'El monto del pago debe ser exactamente {monto} {moneda}',
    nivel: 'WARN'
  },
  PAGO_DUPLICADO: {
    codigo: 'ERR-007',
    mensaje: 'Ya existe un pago registrado para esta reserva',
    nivel: 'INFO'
  },
  PAGO_NO_ENCONTRADO: {
    codigo: 'ERR-007',
    mensaje: 'No se encontró el pago especificado',
    nivel: 'WARN'
  },
  PAGO_RECHAZADO: {
    codigo: 'ERR-007',
    mensaje: 'El pago ha sido rechazado: {motivo}',
    nivel: 'WARN'
  },
  
  // TIMEOUT (ERR-008)
  RESERVA_EXPIRADA: {
    codigo: 'ERR-008',
    mensaje: 'La reserva ha expirado por falta de pago',
    nivel: 'INFO'
  },
  PAGO_EXPIRADO: {
    codigo: 'ERR-008',
    mensaje: 'El tiempo para realizar el pago ha expirado',
    nivel: 'INFO'
  },
  
  // CONCURRENCY (ERR-009)
  CONFLICTO_CONCURRENTE: {
    codigo: 'ERR-009',
    mensaje: 'Otro usuario está intentando reservar las mismas fechas',
    nivel: 'INFO'
  },
  LOCK_NO_OBTENIDO: {
    codigo: 'ERR-009',
    mensaje: 'No se pudo procesar la solicitud, intenta nuevamente',
    nivel: 'WARN'
  },
  
  // SYSTEM (ERR-010)
  ERROR_DB: {
    codigo: 'ERR-010',
    mensaje: 'Error interno del sistema, por favor intenta más tarde',
    nivel: 'CRITICAL'
  },
  ERROR_DESCONOCIDO: {
    codigo: 'ERR-010',
    mensaje: 'Ocurrió un error inesperado',
    nivel: 'CRITICAL'
  }
} as const

export type TipoError = keyof typeof ERRORES
```

### 6.2 Manejo de Errores en Acciones

#### 6.2.1 Wrapper de Error para Server Actions

```typescript
// En src/actions/utils.ts - Helper para server actions

type ServerAction<T> = () => Promise<T>

interface ResultadoAccion<T> {
  exito: boolean
  datos?: T
  error?: AppError
}

export async function ejecutarAccion<T>(
  accion: ServerAction<T>,
  opciones?: {
    onError?: (error: unknown) => AppError
    retryCount?: number
    retryDelay?: number
  }
): Promise<ResultadoAccion<T>> {
  const { onError, retryCount = 0, retryDelay = 1000 } = opciones || {}
  
  let ultimosError: unknown
  
  for (let intento = 0; intento <= retryCount; intento++) {
    try {
      const datos = await accion()
      return { exito: true, datos }
    } catch (error) {
      ultimosError = error
      
      // Si es un error de validación de Zod, no reintentar
      if (error instanceof z.ZodError) {
        const appError = crearError(
          'ERR-001',
          error.errors[0].message,
          JSON.stringify(error.errors),
          'WARN'
        )
        return { exito: false, error: appError }
      }
      
      // Si quedan reintentos, esperar
      if (intento < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (intento + 1)))
      }
    }
  }
  
  // Si llegó aquí, todos los intentos fallaron
  const appError = onError
    ? onError(ultimosError)
    : crearError(
        'ERR-010',
        'Ocurrió un error inesperado, por favor intenta más tarde',
        ultimosError instanceof Error ? ultimosError.message : String(ultimosError),
        'CRITICAL'
      )
  
  return { exito: false, error: appError }
}
```

#### 6.2.2 Ejemplo de Uso en crearReserva

```typescript
// En src/actions/reserva.actions.ts - Implementación con manejo de errores

export async function crearReserva(formData: FormData): Promise<ResultadoAccion<Reserva>> {
  return ejecutarAccion(async () => {
    // 1. Autenticación
    const user = await getUsuarioAutenticado()
    if (!user) {
      throw crearErrorApp('ERR-004', ERRORES.NO_AUTENTICADO)
    }

    // 2. Parsear y validar datos
    const datos = parseFormDataReserva(formData)
    const validacion = crearReservaSchema.safeParse(datos)
    if (!validacion.success) {
      throw crearErrorApp('ERR-001', {
        ...ERRORES.FECHA_INVALIDA,
        mensaje: validacion.error.errors[0].message
      })
    }

    // 3. Obtener propiedad
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: datos.propiedadId },
      include: { propietario: true }
    })
    
    if (!propiedad) {
      throw crearErrorApp('ERR-002', ERRORES.PROPIEDAD_NO_EXISTE)
    }
    
    if (propiedad.estadoPublicacion !== 'PUBLICADA') {
      throw crearErrorApp('ERR-002', ERRORES.PROPIEDAD_NO_DISPONIBLE)
    }

    // 4. Validaciones de negocio
    const noches = calcularNoches(datos.fechaEntrada, datos.fechaSalida)
    
    if (datos.cantidadHuespedes > propiedad.capacidadMaxima) {
      throw crearErrorApp('ERR-002', {
        ...ERRORES.CAPACIDAD_EXCEDIDA,
        mensaje: ERRORES.CAPACIDAD_EXCEDIDA.mensaje.replace(
          '{capacidad}',
          String(propiedad.capacidadMaxima)
        )
      })
    }
    
    if (noches < propiedad.estanciaMinima) {
      throw crearErrorApp('ERR-002', {
        ...ERRORES.ESTANCIA_MINIMA_NO_CUMPLIDA,
        mensaje: ERRORES.ESTANCIA_MINIMA_NO_CUMPLIDA.mensaje.replace(
          '{minimo}',
          String(propiedad.estanciaMinima)
        )
      })
    }

    // 5. Verificar disponibilidad (dentro de transacción)
    const reserva = await prisma.$transaction(async (tx) => {
      // Verificar disponibilidad
      const disponibilidad = await verificarDisponibilidad(
        datos.propiedadId,
        datos.fechaEntrada,
        datos.fechaSalida,
        tx
      )
      
      if (!disponibilidad.disponible) {
        if (disponibilidad.conflicto?.tipo === 'RESERVA_EXISTENTE') {
          throw crearErrorApp('ERR-003', ERRORES.FECHAS_NO_DISPONIBLES)
        }
        if (disponibilidad.conflicto?.tipo === 'FECHA_BLOQUEADA') {
          throw crearErrorApp('ERR-003', ERRORES.FECHA_BLOQUEADA)
        }
      }
      
      // Obtener precio (considerando precios especiales)
      const { subtotal } = await obtenerPrecioParaFechas(
        datos.propiedadId,
        datos.fechaEntrada,
        datos.fechaSalida,
        propiedad.precioPorNoche,
        tx
      )
      
      // Calcular precios finales
      const precios = calcularPrecioReserva(
        Number(propiedad.precioPorNoche),
        datos.fechaEntrada,
        datos.fechaSalida
      )
      
      // Crear la reserva
      return tx.reserva.create({
        data: {
          propiedadId: datos.propiedadId,
          huespedId: user.id,
          fechaEntrada: datos.fechaEntrada,
          fechaSalida: datos.fechaSalida,
          noches: precios.noches,
          precioPorNoche: precios.precioPorNoche,
          subtotal: precios.subtotal,
          comisionPlataforma: precios.comisionHuesped,
          comisionAnfitrion: precios.comisionAnfitrion,
          total: precios.total,
          moneda: propiedad.moneda,
          cantidadHuespedes: datos.cantidadHuespedes,
          notasHuesped: datos.notasHuesped,
          estado: 'PENDIENTE'
        }
      })
    }, {
      isolationLevel: 'Serializable', // Para prevenir race conditions
      timeout: 10000 // 10 segundos
    })

    // 6. Notificar (en background, no bloquear)
    notificarAnfitrionNuevaReserva(reserva).catch(console.error)
    
    // 7. Revalidar paths
    revalidatePath('/dashboard/mis-reservas')
    revalidatePath(`/propiedades/${datos.propiedadId}`)

    return reserva
    
  }, {
    retryCount: 2,
    retryDelay: 500
  })
}
```

### 6.3 Manejo de Race Conditions

#### 6.3.1 Estrategia de Bloqueo Pesimista

```typescript
// En src/lib/db/lock.ts - Utilidades de bloqueo

import { prisma } from '@/lib/prisma'

interface Lock {
  key: string
  release: () => Promise<void>
}

/**
 * Obtiene un bloqueo pesimista para una clave específica
 * Útil para prevenir race conditions en reservas
 */
export async function acquireLock(
  resource: string,
  id: string,
  timeout: number = 5000
): Promise<Lock | null> {
  const lockKey = `lock:${resource}:${id}`
  const lockValue = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + timeout)
  
  try {
    // Intentar crear el lock
    await prisma.$executeRaw`
      INSERT INTO distributed_locks (key, value, expires_at)
      VALUES (${lockKey}, ${lockValue}, ${expiresAt})
      ON CONFLICT (key) DO NOTHING
      RETURNING id
    `
    
    // Verificar si se obtuvo el lock
    const result = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM distributed_locks 
      WHERE key = ${lockKey} AND value = ${lockValue}
    `
    
    if (result.length === 0) {
      return null // No se obtuvo el lock
    }
    
    return {
      key: lockKey,
      release: async () => {
        await prisma.$executeRaw`
          DELETE FROM distributed_locks 
          WHERE key = ${lockKey} AND value = ${lockValue}
        `
      }
    }
  } catch (error) {
    console.error('Error acquiring lock:', error)
    return null
  }
}

/**
 * Versión más simple sin tabla de locks
 * Usa una transacción serializable con retry
 */
export async function withSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: 'Serializable',
        timeout: 10000
      })
    } catch (error: any) {
      // Error de serialización - retry
      if (error.code === 'P2034' && attempt < maxRetries - 1) {
        console.warn(`Serializable transaction failed, retry ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
```

#### 6.3.2 Verificación de Disponibilidad con Lock

```typescript
// En src/lib/reserva/disponibilidad.ts

export async function verificarDisponibilidadAtomica(
  propiedadId: string,
  fechaEntrada: Date,
  fechaSalida: Date
): Promise<VerificacionDisponibilidad> {
  return withSerializableTransaction(async (tx) => {
    // Double-check dentro de la transacción
    const reservasConflicto = await tx.reserva.findFirst({
      where: {
        propiedadId,
        estado: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
        OR: [
          {
            fechaEntrada: { lt: fechaSalida },
            fechaSalida: { gt: fechaEntrada }
          }
        ]
      },
      select: { id: true }
    })
    
    if (reservasConflicto) {
      return {
        disponible: false,
        conflicto: {
          tipo: 'RESERVA_EXISTENTE',
          reservaId: reservasConflicto.id
        }
      }
    }
    
    // Verificar fechas bloqueadas
    const fechaBloqueada = await tx.fechaBloqueada.findFirst({
      where: {
        propiedadId,
        fechaInicio: { lt: fechaSalida },
        fechaFin: { gt: fechaEntrada }
      }
    })
    
    if (fechaBloqueada) {
      return {
        disponible: false,
        conflicto: {
          tipo: 'FECHA_BLOQUEADA',
          fechaBloqueadaId: fechaBloqueada.id
        }
      }
    }
    
    return { disponible: true }
  })
}
```

### 6.4 Timeouts y Reintentos

#### 6.4.1 Job de Expiración de Reservas

```typescript
// En src/app/api/cron/expirar-reservas/route.ts
// Este endpoint debe ser llamado por un cron job cada hora

export async function POST(request: Request) {
  // Verificar secret del cron job
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const ahora = new Date()
  const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
  
  // Buscar reservas pendientes mayores a 24 horas
  const reservasExpiradas = await prisma.reserva.findMany({
    where: {
      estado: 'PENDIENTE',
      fechaCreacion: { lt: hace24Horas },
      pagos: { none: {} } // Sin pagos asociados
    },
    include: {
      propiedad: { select: { titulo: true } },
      huesped: { select: { email: true, nombre: true } }
    }
  })
  
  const resultados = []
  
  for (const reserva of reservasExpiradas) {
    // Cancelar la reserva
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        estado: 'CANCELADA_HUESPED',
        fechaCancelacion: ahora,
        notasInternas: 'Expirada por falta de pago (>24h)'
      }
    })
    
    // Notificar al huésped
    await enviarEmailExpiracion(reserva)
    
    resultados.push({
      reservaId: reserva.id,
      expirada: true
    })
  }
  
  return Response.json({
    procesadas: resultados.length,
    reservas: resultados
  })
}
```

---

## 7. SEGURIDAD

### 7.1 Control de Acceso (RBAC Simplificado)

#### 7.1.1 Definición de Permisos

```typescript
// En src/lib/auth/permissions.ts

enum Accion {
  // Propiedades
  CREAR_PROPIEDAD = 'crear_propiedad',
  EDITAR_PROPIEDAD = 'editar_propiedad',
  ELIMINAR_PROPIEDAD = 'eliminar_propiedad',
  VER_PROPIEDAD = 'ver_propiedad',
  
  // Reservas
  CREAR_RESERVA = 'crear_reserva',
  VER_MIS_RESERVAS = 'ver_mis_reservas',
  VER_RESERVAS_RECIBIDAS = 'ver_reservas_recibidas',
  CONFIRMAR_RESERVA = 'confirmar_reserva',
  RECHAZAR_RESERVA = 'rechazar_reserva',
  CANCELAR_RESERVA = 'cancelar_reserva',
  
  // Pagos
  REGISTRAR_PAGO = 'registrar_pago',
  VERIFICAR_PAGO = 'verificar_pago',
  VER_MIS_PAGOS = 'ver_mis_pagos'
}

enum Rol {
  HUESPED = 'HUESPED',
  ANFITRION = 'ANFITRION',
  AMBOS = 'AMBOS',
  ADMIN = 'ADMIN'
}

const PERMISOS_POR_ROL: Record<Rol, Accion[]> = {
  [Rol.HUESPED]: [
    Accion.CREAR_RESERVA,
    Accion.VER_MIS_RESERVAS,
    Accion.CANCELAR_RESERVA, // Solo sus propias reservas
    Accion.REGISTRAR_PAGO,
    Accion.VER_MIS_PAGOS,
    Accion.VER_PROPIEDAD
  ],
  [Rol.ANFITRION]: [
    Accion.CREAR_PROPIEDAD,
    Accion.EDITAR_PROPIEDAD,
    Accion.VER_PROPIEDAD,
    Accion.VER_RESERVAS_RECIBIDAS,
    Accion.CONFIRMAR_RESERVA,
    Accion.RECHAZAR_RESERVA,
    Accion.CANCELAR_RESERVA,
    Accion.VERIFICAR_PAGO,
    Accion.VER_MIS_PAGOS
  ],
  [Rol.AMBOS]: [
    ...PERMISOS_POR_ROL[Rol.HUESPED],
    ...PERMISOS_POR_ROL[Rol.ANFITRION]
  ],
  [Rol.ADMIN]: Object.values(Accion) // Todos los permisos
}
```

#### 7.1.2 Middleware de Permisos

```typescript
// En src/lib/auth/permissions.ts - Helper de verificación

export async function verificarPermiso(
  usuarioId: string,
  accion: Accion,
  recursoId?: string,
  opciones?: { tx?: Prisma.TransactionClient }
): Promise<boolean> {
  const client = opciones?.tx || prisma
  
  // Obtener usuario con rol
  const usuario = await client.usuario.findUnique({
    where: { id: usuarioId },
    select: { rol: true }
  })
  
  if (!usuario) return false
  
  // Verificar si tiene el permiso
  const permisos = PERMISOS_POR_ROL[usuario.rol as Rol] || []
  if (!permisos.includes(accion)) return false
  
  // Verificaciones adicionales según la acción
  switch (accion) {
    case Accion.CANCELAR_RESERVA:
      if (recursoId) {
        // Verificar que la reserva pertenece al usuario
        const reserva = await client.reserva.findFirst({
          where: {
            id: recursoId,
            huespedId: usuarioId
          }
        })
        return reserva !== null
      }
      return false
      
    case Accion.CONFIRMAR_RESERVA:
    case Accion.RECHAZAR_RESERVA:
      if (recursoId) {
        // Verificar que el usuario es el anfitrión de la propiedad
        const reserva = await client.reserva.findFirst({
          where: {
            id: recursoId,
            propiedad: { propietarioId: usuarioId }
          }
        })
        return reserva !== null
      }
      return false
      
    case Accion.VERIFICAR_PAGO:
      if (recursoId) {
        const pago = await client.pago.findUnique({
          where: { id: recursoId },
          include: { reserva: { include: { propiedad: true } } }
        })
        return pago?.reserva.propiedad.propietarioId === usuarioId
      }
      return false
      
    default:
      return true
  }
}
```

### 7.2 Rate Limiting

#### 7.2.1 Implementación de Rate Limiting

```typescript
// En src/lib/ratelimit.ts

interface RateLimitConfig {
  windowMs: number    // Ventana de tiempo en ms
  maxRequests: number // Máximo de requests en la ventana
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  crearReserva: { windowMs: 60000, maxRequests: 5 },    // 5 por minuto
  buscarPropiedades: { windowMs: 60000, maxRequests: 30 }, // 30 por minuto
  registrarPago: { windowMs: 3600000, maxRequests: 10 }, // 10 por hora
  login: { windowMs: 900000, maxRequests: 5 } // 5 por 15 minutos
}

// En la práctica, esto se implementaría con Redis
// Para esta implementación, usamos una tabla en BD
export async function checkRateLimit(
  userId: string,
  accion: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[accion]
  if (!config) return { allowed: true, remaining: Infinity, resetAt: new Date() }
  
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  
  // Limpiar entradas antiguas (en producción sería un TTL de Redis)
  await prisma.rateLimitLog.deleteMany({
    where: {
      userId,
      accion,
      timestamp: { lt: windowStart }
    }
  })
  
  // Contar requests en la ventana actual
  const count = await prisma.rateLimitLog.count({
    where: {
      userId,
      accion,
      timestamp: { gte: windowStart }
    }
  })
  
  if (count >= config.maxRequests) {
    const oldestInWindow = await prisma.rateLimitLog.findFirst({
      where: { userId, accion },
      orderBy: { timestamp: 'asc' }
    })
    
    const resetAt = oldestInWindow
      ? new Date(oldestInWindow.timestamp.getTime() + config.windowMs)
      : new Date(now.getTime() + config.windowMs)
    
    return {
      allowed: false,
      remaining: 0,
      resetAt
    }
  }
  
  // Registrar el request
  await prisma.rateLimitLog.create({
    data: { userId, accion }
  })
  
  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    resetAt: new Date(now.getTime() + config.windowMs)
  }
}
```

### 7.3 Validación de IDs (IDOR Prevention)

```typescript
// En src/lib/security/idor.ts

/**
 * Previene ataques de IDOR (Insecure Direct Object Reference)
 * Verifica que el usuario tiene acceso al recurso antes de retornarlo
 */

export async function verificarAccesoReserva(
  reservaId: string,
  usuarioId: string,
  tx?: Prisma.TransactionClient
): Promise<Reserva | null> {
  const client = tx || prisma
  
  const reserva = await client.reserva.findUnique({
    where: { id: reservaId },
    include: {
      propiedad: { select: { propietarioId: true } },
      huesped: { select: { id: true } }
    }
  })
  
  if (!reserva) return null
  
  // Verificar si es el huésped o el anfitrión
  const esHuesped = reserva.huesped.id === usuarioId
  const esAnfitrion = reserva.propiedad.propietarioId === usuarioId
  
  // En el futuro, verificar si es admin
  // const esAdmin = await verificarRolAdmin(usuarioId)
  
  if (!esHuesped && !esAnfitrion) {
    return null // No tiene acceso
  }
  
  return reserva
}

export async function verificarAccesoPropiedad(
  propiedadId: string,
  usuarioId: string,
  tx?: Prisma.TransactionClient
): Promise<Propiedad | null> {
  const client = tx || prisma
  
  const propiedad = await client.propiedad.findUnique({
    where: { id: propiedadId },
    include: { propietario: { select: { id: true, rol: true } } }
  })
  
  if (!propiedad) return null
  
  // Es propietario o es admin
  const esPropietario = propiedad.propietario.id === usuarioId
  const esAdmin = propiedad.propietario.rol === 'ADMIN'
  
  if (!esPropietario && !esAdmin) {
    return null
  }
  
  return propiedad
}
```

---

## 8. ARQUITECTURA DE IMPLEMENTACIÓN

### 8.1 Estructura de Archivos

```
src/
├── actions/
│   ├── reserva.actions.ts          # Acciones de reserva (CREAR, CANCELAR)
│   ├── reserva-confirmar.actions.ts # Confirmar/rechazar reserva
│   └── reserva-interna.actions.ts  # Funciones internas compartidas
├── lib/
│   ├── calculations.ts             # Cálculos de precio y reembolso
│   ├── validations.ts              # Esquemas Zod y funciones de validación
│   ├── errors/
│   │   ├── index.ts               # Definición de errores
│   │   ├── mapa.ts                # Mapa de errores
│   │   └── handler.ts             # Handler de errores
│   ├── reservas/
│   │   ├── disponibilidad.ts      # Verificación de disponibilidad
│   │   ├── precios.ts             # Cálculo de precios
│   │   ├── estados.ts             # Máquina de estados
│   │   └── permisos.ts            # Verificación de permisos
│   ├── db/
│   │   ├── lock.ts                # Utilidades de locking
│   │   └── transaction.ts         # Wrapper de transacciones
│   ├── auth/
│   │   ├── permissions.ts         # Sistema de permisos
│   │   └── rate-limit.ts          # Rate limiting
│   └── notifications/
│       ├── email.ts               # Envío de emails
│       └── types.ts               # Tipos de notificaciones
├── types/
│   ├── reserva.ts                 # Tipos específicos de reserva
│   ├── errors.ts                  # Tipos de errores
│   └── api.ts                     # Tipos de respuesta API
├── app/
│   ├── api/
│   │   ├── reservas/
│   │   │   ├── route.ts           # POST crear reserva
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET, DELETE reserva
│   │   │       └── confirmar/
│   │   │           └── route.ts   # POST confirmar/rechazar
│   │   └── cron/
│   │       └── expirar-reservas/
│   │           └── route.ts       # Job de expiración
│   └── (main)/
│       └── propiedades/
│           └── [id]/
│               └── reservar/
│                   └── page.tsx   # Página de reserva con widget
└── components/
    └── reservas/
        ├── BookingWidget.tsx      # Widget interactivo
        ├── BookingCalendar.tsx    # Calendario de selección
        ├── PriceBreakdown.tsx     # Desglose de precios
        └── BookingConfirmation.tsx # Confirmación
```

### 8.2 Diagrama de Secuencia - Crear Reserva

```
┌─────────┐          ┌──────────┐         ┌─────────┐         ┌───────────┐         ┌────────────┐
│ Huésped │          │ Frontend │         │ API     │         │ Validations│         │   BD       │
└────┬────┘          └─────┬────┘         └────┬────┘         └─────┬─────┘         └─────┬─────┘
     │                    │                    │                    │                    │
     │ 1. Selecciona fechas│                    │                    │                    │
     │───────────────────>│                    │                    │                    │
     │                    │                    │                    │                    │
     │ 2. Valida fechas   │                    │                    │                    │
     │                    │───────────────────>│                    │                    │
     │                    │                    │                    │                    │
     │ 3. Verif disponibilidad                    │                    │                    │
     │                    │                    │───────────────────>│                    │
     │                    │                    │                    │                    │
     │                    │                    │                    │◄─Query reservas────│
     │                    │                    │                    │───────────────────>│
     │                    │                    │                    │                    │
     │ 4. Muestra precios │                    │                    │                    │
     │<───────────────────│                    │                    │                    │
     │                    │                    │                    │                    │
     │ 5. Confirma reserva│                    │                    │                    │
     │───────────────────>│                    │                    │                    │
     │                    │                    │                    │                    │
     │ 6. POST /reservas  │                    │                    │                    │
     │                    │───────────────────>│                    │                    │
     │                    │                    │                    │                    │
     │                    │ 7. Inicia TX       │                    │                    │
     │                    │                    │───────────────────>│                    │
     │                    │                    │                    │                    │
     │                    │                    │ 8. Lock + Verif    │                    │
     │                    │                    │                    │◄─SELECT FOR UPDATE─│
     │                    │                    │                    │───────────────────>│
     │                    │                    │                    │                    │
     │                    │                    │ 9. Validar reglas  │                    │
     │                    │                    │                    │◄─Check negocio─────│
     │                    │                    │                    │                    │
     │                    │                    │ 10. INSERT reserva │                    │
     │                    │                    │                    │───────────────────>│
     │                    │                    │                    │                    │
     │                    │                    │ 11. COMMIT         │                    │
     │                    │                    │                    │───────────────────>│
     │                    │                    │                    │                    │
     │ 12. Reserva creada │                    │                    │                    │
     │<───────────────────│                    │                    │                    │
     │                    │                    │                    │                    │
     │                    │ 13. Notificar (async)                    │                    │
     │                    │─────────────────────────────────────────>│                    │
     │                    │                    │                    │                    │
```

### 8.3 Flujo de Estados Detallado

```
CREAR RESERVA (Happy Path):
───────────────────────────────────────────────────────────────

1. [UI] Usuario selecciona fechas → 2. [UI] Valida entrada/salida
3. [UI] Calcula noches = salida - entrada
4. [UI] Usuario ingresa huéspedes → 5. [UI] Valida capacidad
6. [UI] Muestra desglose de precios
7. [UI] Usuario clickea "Reservar" → 8. [API] POST /api/reservas
9. [API] Verifica auth → 10. [API] Valida input (Zod)
11. [API] Obtiene propiedad → 12. [API] Valida reglas de negocio
13. [API] Verifica disponibilidad (TX)
14. [API] Calcula precios finales
15. [API] Crea reserva (PENDIENTE) → 16. [API] Crea pago (PENDIENTE)
17. [API] Commit TX → 18. [API] Encola notificación
19. [API] Returns 201 Created
20. [UI] Muestra confirmación
21. [Background] Email al anfitrión


CANCELAR RESERVA (Huésped):
───────────────────────────────────────────────────────────────

1. [UI] Usuario clickea "Cancelar" → 2. [UI] Muestra modal con política
3. [UI] Usuario confirma → 4. [API] DELETE /api/reservas/:id
5. [API] Verifica auth → 6. [API] Verifica que es el huésped
7. [API] Obtiene reserva → 8. [API] Verifica estado permite cancelación
9. [API] Calcula reembolso (política)
10. [API] UPDATE reserva (CANCELADA_HUESPED)
11. [API] Programa reembolso si aplica
12. [API] Notifica al anfitrión
13. [API] Returns 200 OK
14. [UI] Muestra confirmación de cancelación
15. [Background] Email al anfitrión


CONFIRMAR RESERVA (Anfitrión):
───────────────────────────────────────────────────────────────

1. [UI] Anfitrión ve reserva PENDIENTE
2. [UI] Clickea "Confirmar" → 3. [API] POST /api/reservas/:id/confirmar
4. [API] Verifica auth → 5. [API] Verifica que es el anfitrión
6. [API] Obtiene reserva → 7. [API] Verifica estado = PENDIENTE
8. [API] Verifica pago verificado → 9. [API] UPDATE (CONFIRMADA)
10. [API] Notifica al huésped
11. [API] Returns 200 OK
12. [UI] Muestra confirmación
13. [Background] Email al huésped
```

---

## 9. API CONTRACT

### 9.1 Endpoints

#### POST /api/reservas - Crear Reserva

**Request:**
```typescript
interface CrearReservaRequest {
  propiedadId: string
  fechaEntrada: string  // ISO 8601: "2026-04-15"
  fechaSalida: string   // ISO 8601: "2026-04-18"
  cantidadHuespedes: number
  notasHuesped?: string
}
```

**Response (201 Created):**
```typescript
interface CrearReservaResponse {
  exito: true
  datos: {
    id: string
    codigo: string
    estado: 'PENDIENTE'
    fechaEntrada: string
    fechaSalida: string
    noches: number
    precioPorNoche: number
    subtotal: number
    comisionPlataforma: number
    total: number
    moneda: 'USD' | 'VES'
    cantidadHuespedes: number
    propiedad: {
      id: string
      titulo: string
    }
    pago: {
      id: string
      montoEsperado: number
      metodosDisponibles: MetodoPagoEnum[]
    }
    politicaCancelacion: {
      tipo: 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA'
      nombre: string
      reglas: string
    }
  }
}
```

**Error Response (400/409/500):**
```typescript
interface ErrorResponse {
  exito: false
  error: AppError
}
```

#### GET /api/reservas/:id - Obtener Reserva

**Response (200 OK):**
```typescript
interface ObtenerReservaResponse {
  exito: true
  datos: {
    id: string
    codigo: string
    estado: EstadoReserva
    fechaEntrada: string
    fechaSalida: string
    noches: number
    precioPorNoche: number
    subtotal: number
    comisionPlataforma: number
    total: number
    moneda: 'USD' | 'VES'
    cantidadHuespedes: number
    notasHuesped?: string
    fechaCreacion: string
    fechaConfirmacion?: string
    fechaCancelacion?: string
    propiedad: {
      id: string
      titulo: string
      direccion: string
      imagenPrincipal: string
    }
    huesped: {
      id: string
      nombre: string
      apellido: string
      avatarUrl?: string
    }
    pago?: {
      id: string
      monto: number
      metodoPago: MetodoPagoEnum
      estado: EstadoPago
      fechaCreacion: string
    }
    politicaCancelacion: PoliticaCancelacionInfo
  }
}
```

#### DELETE /api/reservas/:id - Cancelar Reserva

**Request:**
```typescript
interface CancelarReservaRequest {
  motivo?: string
}
```

**Response (200 OK):**
```typescript
interface CancelarReservaResponse {
  exito: true
  datos: {
    id: string
    estado: 'CANCELADA_HUESPED' | 'CANCELADA_ANFITRION'
    fechaCancelacion: string
    reembolso: {
      montoReembolsable: number
      montoNoReembolsable: number
      porcentajeReembolso: number
      metodoReembolso: string  // Igual al método de pago
      tiempoProcesamiento: string  // "5-10 días hábiles"
    }
    mensaje: string
  }
}
```

#### POST /api/reservas/:id/confirmar - Confirmar Reserva

**Request:**
```typescript
interface ConfirmarReservaRequest {
  accion: 'confirmar' | 'rechazar'
  motivo?: string
}
```

**Response (200 OK):**
```typescript
interface ConfirmarReservaResponse {
  exito: true
  datos: {
    id: string
    estado: 'CONFIRMADA' | 'RECHAZADA'
    fechaConfirmacion?: string
    fechaRechazo?: string
    mensaje: string
  }
}
```

### 9.2 Códigos de Error de la API

| HTTP Status | Código | Descripción |
|-------------|--------|-------------|
| 400 | ERR-001 | Error de validación |
| 401 | ERR-004 | No autenticado |
| 403 | ERR-005 | Sin permisos |
| 404 | ERR-002 | Reserva no encontrada |
| 409 | ERR-003 | Conflicto de disponibilidad |
| 409 | ERR-006 | Estado inválido para la operación |
| 422 | ERR-007 | Error de pago |
| 429 | ERR-009 | Rate limit excedido |
| 500 | ERR-010 | Error interno |

---

## 10. PLAN DE IMPLEMENTACIÓN

### 10.1 Fases de Implementación

#### Fase 1: Fundamentos (Semana 1)
- [ ] Definir tipos y constantes de errores
- [ ] Implementar sistema de errores centralizado
- [ ] Crear helper de transacciones
- [ ] Implementar función de locking
- [ ] Crear schemas Zod completos
- [ ] Escribir tests unitarios de validación

#### Fase 2: Core de Reservas (Semana 2)
- [ ] Implementar `verificarDisponibilidadAtomica`
- [ ] Implementar `crearReserva` con todas las validaciones
- [ ] Implementar `calcularReembolsoCompleto`
- [ ] Implementar `cancelarReserva`
- [ ] Implementar `confirmarReserva` y `rechazarReserva`
- [ ] Escribir tests de integración

#### Fase 3: API Endpoints (Semana 2-3)
- [ ] POST /api/reservas
- [ ] GET /api/reservas/:id
- [ ] DELETE /api/reservas/:id
- [ ] POST /api/reservas/:id/confirmar
- [ ] POST /api/reservas/:id/pago
- [ ] GET /api/reservas/mis-reservas
- [ ] GET /api/reservas/recibidas

#### Fase 4: Frontend Widget (Semana 3-4)
- [ ] BookingWidget component
- [ ] BookingCalendar component
- [ ] PriceBreakdown component
- [ ] Integración con API
- [ ] Estados de carga y error
- [ ] Animaciones

#### Fase 5: Notificaciones y Cron (Semana 4)
- [ ] Sistema de templates de email
- [ ] Cola de notificaciones
- [ ] Job de expiración de reservas
- [ ] Job de check-in automático
- [ ] Job de check-out automático

#### Fase 6: Testing y polish (Semana 5)
- [ ] Tests E2E del flujo completo
- [ ] Tests de concurrencia
- [ ] Tests de edge cases
- [ ] Documentación de API
- [ ] Testing de performance

### 10.2 Estimación de Esfuerzo

| Componente | Complexity | Estimated Hours |
|------------|------------|-----------------|
| Sistema de errores | Medium | 8 |
| Validaciones | High | 16 |
| Transacciones y locking | High | 12 |
| crearReserva | High | 16 |
| cancelarReserva | Medium | 8 |
| confirmarRechazar | Medium | 8 |
| API endpoints | Medium | 16 |
| Frontend widget | High | 24 |
| Notificaciones | Medium | 12 |
| Jobs de cron | Medium | 8 |
| Testing | High | 24 |
| **Total** | | **152 horas** |

---

## 11. TESTING PLAN

### 11.1 Test Cases Unitarios

#### Validación de Fechas
```
✓ Debe rechazar fecha de entrada pasada
✓ Debe rechazar fecha de salida antes de entrada
✓ Debe rechazar fechas con más de 365 noches
✓ Debe aceptar fechas válidas
✓ Debe rechazar fecha de entrada = fecha de salida
```

#### Validación de Capacidad
```
✓ Debe rechazar huéspedes > capacidad máxima
✓ Debe rechazar huéspedes < 1
✓ Debe aceptar cantidad válida
✓ Debe rechazar decimales
```

#### Validación de Estancia
```
✓ Debe rechazar noches < estancia mínima
✓ Debe rechazar noches > estancia máxima (si está configurado)
✓ Debe aceptar estancia dentro del rango
```

#### Cálculo de Precios
```
✓ Debe calcular correctamente noches
✓ Debe calcular comisión del 6%
✓ Debe calcular comisión del 3% para anfitrión
✓ Debe aplicar precios especiales cuando corresponde
```

#### Cálculo de Reembolso
```
✓ Flexible - 24h antes: 100%
✓ Flexible - <24h: 0%
✓ Moderada - 5 días antes: 100%
✓ Moderada - 2 días antes: 50%
✓ Estricta - 14 días antes: 100%
✓ Estricta - 10 días antes: 50%
✓ Estricta - 3 días antes: 0%
```

### 11.2 Test Cases de Integración

#### Crear Reserva
```
✓ Happy path: reserva exitosa
✓ Reserva con fechas bloqueadas
✓ Reserva con conflicto de disponibilidad
✓ Reserva con capacidad excedida
✓ Reserva con estancia mínima no cumplida
✓ Reserva sin autenticación
✓ Reserva de propiedad no publicada
✓ Double booking (dos usuarios simultáneos)
```

#### Cancelar Reserva
```
✓ Cancelación por huésped - Política flexible (100%)
✓ Cancelación por huésped - Política moderada (50%)
✓ Cancelación por huésped - Política estricta (0%)
✓ Cancelación por anfitrión
✓ Cancelación de reserva ya cancelada
✓ Cancelación de reserva completada
✓ Cancelación sin ser el propietario
```

#### Confirmar Reserva
```
✓ Confirmar reserva pendiente con pago verificado
✓ Rechazar reserva pendiente
✓ Confirmar reserva ya confirmada
✓ Confirmar reserva cancelada
✓ Confirmar sin ser el anfitrión
```

### 11.3 Test Cases de Concurrencia

```
✓ Dos usuarios intentando reservar las mismas fechas
✓ Dos usuarios cancelando la misma reserva simultáneamente
✓ Pago duplicado simultáneo
✓ Timeout de lock funcionando
✓ Retry en caso de conflicto de serialización
```

---

## APÉNDICE A: GLOSARIO

| Término | Definición |
|---------|------------|
| Race condition | Cuando dos operaciones compiten por el mismo recurso |
| Double booking | Dos reservas para las mismas fechas |
| Lock | Mecanismo para prevenir acceso simultáneo a un recurso |
| Serializable | Nivel de aislamiento que previene anomalías de concurrencia |
| Idempotente | Operación que produce el mismo resultado si se ejecuta múltiples veces |
| UTC | Coordinated Universal Time |
| CUID | Collision-resistant Unique Identifier |

## APÉNDICE B: REFERENCIAS

- PostgreSQL Transaction Isolation: https://www.postgresql.org/docs/current/transaction-iso.html
- Zod Validation: https://zod.dev/
- Prisma Transactions: https://www.prgresql.org/docs/current/transaction-iso.html

---

*Documento creado: 6 de Abril de 2026*  
*Última actualización: 6 de Abril de 2026*  
*Versión: 1.0*
