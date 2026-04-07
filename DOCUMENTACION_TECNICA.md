# Documentación Técnica del Proyecto Boogie

Plataforma de alquiler vacacional para Venezuela.

---

## 1. ARQUITECTURA Y TECH STACK

### 1.1 Stack Tecnológico Principal

El proyecto utiliza **Next.js 14+** con App Router como framework principal. La arquitectura sigue el patrón de Server Components para renderizado del lado del servidor, con Client Components cuando se requiere interactividad. El stack incluye:

- **Runtime**: Node.js con TypeScript strict
- **Framework**: Next.js 14+ (App Router)
- **Base de datos**: PostgreSQL via Prisma ORM
- **Autenticación**: Supabase Auth (provider)
- **Estilado**: Tailwind CSS con utility classes
- **Animaciones**: Framer Motion
- **Formularios**: React Hook Form + Zod validation
- **Estado**: TanStack Query para cacheo de datos

### 1.2 Estructura de Rutas

La estructura de carpetas en `src/app/` define las rutas de la aplicación:

```
src/app/
├── (auth)/           # Grupo de rutas de autenticación
│   ├── login/
│   ├── registro/
│   ├── verificar-email/
│   └── recuperar-contrasena/
├── (main)/           # Grupo de rutas públicas principales
│   ├── page.tsx      # Landing page
│   ├── propiedades/  # Catálogo de propiedades
│   ├── zonas/        # Página de zonas
│   └── como-funciona/
├── (panel)/          # Grupo de dashboard (protegido)
│   └── dashboard/
├── api/              # Rutas API
└── layout.tsx        # Root layout
```

Los grupos de rutas `(auth)`, `(main)` y `(panel)` se crean mediante carpetas con paréntesis y comparten layouts dentro del grupo.

### 1.3 Configuración de Variables de Entorno

El proyecto requiere las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
COMISION_PLATAFORMA_HUESPED=0.06
COMISION_PLATAFORMA_ANFITRION=0.03
```

La variable `SUPABASE_SERVICE_ROLE_KEY` es crítica porque se usa en el cliente admin para operaciones privilegiadas (lectura de todas las propiedades publicadas).

---

## 2. ESQUEMA DE BASE DE DATOS (Prisma)

### 2.1 Modelo de Usuario (`Usuario`)

Located in `prisma/schema.prisma:17-41`

```prisma
model Usuario {
  id              String   @id @default(cuid())
  email           String   @unique
  nombre          String
  apellido        String
  telefono        String?
  avatarUrl       String?  @map("avatar_url")
  cedula          String?  @unique
  verificado      Boolean  @default(false)
  rol             Rol      @default(HUESPED)
  ...
}
```

**Protocolo de identificación**: Cada usuario tiene un ID generado por CUID (Collision-resistant Unique Identifier) que es compatible con UUID v4 de Supabase Auth. El campo `email` es único para evitar duplicados.

**Sistema de roles** (`enum Rol`): `HUESPED`, `ANFITRION`, `AMBOS`, `ADMIN`. El rol por defecto es `HUESPED` y permite al usuario evolucionar a anfitrión.

**Campos de tracking temporal**:
- `fechaRegistro`: Timestamp de creación
- `ultimaActividad`: Se actualiza en cada login para tracking de actividad
- `activo`: Soft delete flag para desactivar usuarios sin borrar registros relacionados

### 2.2 Modelo de Propiedad (`Propiedad`)

Located in `prisma/schema.prisma:54-105`

```prisma
model Propiedad {
  id                String            @id @default(cuid())
  titulo            String
  descripcion       String            @db.Text
  tipoPropiedad     TipoPropiedad     @map("tipo_propiedad")
  precioPorNoche    Decimal           @map("precio_por_noche") @db.Decimal(10, 2)
  moneda            Moneda            @default(USD)
  ...
  estadoPublicacion EstadoPublicacion @default(BORRADOR) @map("estado_publicacion")
  ...
}
```

**Estados de publicación** (`enum EstadoPublicacion`):
- `BORRADOR`: Propiedad en creación, no visible públicamente
- `PENDIENTE_REVISION`: Esperando revisión de admin
- `PUBLICADA`: Visible en el catálogo
- `PAUSADA`: Temporalmente no disponible
- `SUSPENDIDA`: Eliminada o suspendida por violation

**Índices importantes**:
```prisma
@@index([ciudad])
@@index([estado])
@@index([estadoPublicacion])
@@index([precioPorNoche])
@@index([ratingPromedio])
```

El índice compuesto en `reservas`:
```prisma
@@index([propiedadId, fechaEntrada, fechaSalida])
```
Es crítico para verificar disponibilidad efficiently.

### 2.3 Modelo de Reserva (`Reserva`)

Located in `prisma/schema.prisma:195-230`

**Estados de reserva** (`enum EstadoReserva`):
- `PENDIENTE`: Esperando confirmación del anfitrión
- `CONFIRMADA`: Aprobada y pagada
- `EN_CURSO`: El huésped está hospedado
- `COMPLETADA`: Reserva finalizada
- `CANCELADA_HUESPED`: Cancelada por el huésped
- `CANCELADA_ANFITRION`: Cancelada por el anfitrión
- `RECHAZADA`: Rechazada sin completar

**Cálculo de precios**: Los campos `subtotal`, `comisionPlataforma`, `comisionAnfitrion` y `total` se calculan al momento de la reserva usando la función `calcularPrecioReserva` en `src/lib/calculations.ts:9-28`.

### 2.4 Modelo de Pago (`Pago`)

Located in `prisma/schema.prisma:246-275`

**Estados de pago** (`enum EstadoPago`):
- `PENDIENTE`: Esperando confirmación del usuario
- `EN_VERIFICACION`: El anfitrión está verificando el comprobante
- `VERIFICADO`: Comprobante verificado
- `ACREDITADO`: Fondos confirmados en cuenta
- `RECHAZADO`: Pago rechazado
- `REEMBOLSADO`: Reembolso procesado

**Métodos de pago locales** (`enum MetodoPagoEnum`):
- `TRANSFERENCIA_BANCARIA`: Transferencia a cuenta local
- `PAGO_MOVIL`: Pago móvil Venezuela
- `ZELLE`: Pago internacional Zelle
- `EFECTIVO_FARMATODO`: Efectivo en Farmatodo
- `USDT`: Criptomoneda Tether
- `TARJETA_INTERNACIONAL`: Tarjetas Visa/Mastercard internacionales
- `EFECTIVO`: Pago en efectivo presencial

---

## 3. SISTEMA DE AUTENTICACIÓN

### 3.1 Arquitectura de Auth

Located in `src/actions/auth.actions.ts`

El sistema usa **Supabase Auth** como provider principal. El flujo de autenticación:

1. **Registro** (`registrarUsuario`): Crea usuario en Supabase Auth y luego en Prisma
2. **Login** (`iniciarSesion`): Valida credenciales contra Supabase
3. **Logout** (`cerrarSesion`): Cierra sesión y redirige al home

**Protocolo de registro** (`src/actions/auth.actions.ts:12-59`):

```typescript
// 1. Validar datos con Zod
const validacion = registroSchema.safeParse(datos)

// 2. Crear usuario en Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: datos.email,
  password: datos.password,
  options: {
    data: { nombre, apellido, telefono } // metadata
  }
})

// 3. Crear perfil en Prisma con el mismo ID
await prisma.usuario.create({
  data: {
    id: data.user.id,  // Usa el ID de Supabase
    email: datos.email,
    ...
  }
})
```

**Validación con Zod** (`src/lib/validations.ts:6-16`):

```typescript
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
```

### 3.2 Middleware de Protección

Located in `src/middleware.ts`

El middleware actúa como **guardián de rutas** con las siguientes reglas:

```typescript
const RUTAS_PUBLICAS = [
  '/', '/propiedades', '/zonas', '/como-funciona',
  '/login', '/registro', '/recuperar-contrasena', '/verificar-email'
]
```

**Lógica de protección** (`src/middleware.ts:28-83`):

1. Verifica credenciales de Supabase
2. Si el usuario está autenticado y visita páginas de auth, redirige a `/dashboard`
3. Si el usuario NO está autenticado y visita rutas protegidas, redirige a `/login` con parámetro `redirect`
4. Permite acceso a rutas API para manejo de errores apropiado

**Patrón de matching**:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
]
```
Excluye archivos estáticos de Next.js del middleware.

---

## 4. CLIENTES DE SUPABASE

### 4.1 Cliente de Servidor (Server Components)

Located in `src/lib/supabase/server.ts`

```typescript
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { ... }
      }
    }
  )
}
```

**Uso**: Server Actions, Server Components, API Routes.

### 4.2 Cliente Admin (Service Role)

Located in `src/lib/supabase/admin.ts`

```typescript
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Privilegios elevados
  )
}
```

**Uso en propiedad.actions.ts:218**:
```typescript
const supabase = createAdminClient()
// Query a propiedades publicadas
query = supabase
  .from('propiedades')
  .select('*, imagenes:imagenes_propiedad...')
  .eq('estado_publicacion', 'PUBLICADA')
```

**Advertencia de seguridad**: El service role key tiene permisos de superuser. Nunca exponga esta variable al cliente.

### 4.3 Cliente Navegador

Located in `src/lib/supabase/client.ts`

```typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Uso**: Componentes del cliente que requieren auth state reactivo.

---

## 5. BÚSQUEDA Y FILTROS

### 5.1 Search Bar Component

Located in `src/components/busqueda/search-bar.tsx`

**Componentes integrados**:

1. **LocationPicker**: Búsqueda de ubicaciones con autocomplete
2. **DatePickerPopup**: Calendario custom para selección de fechas
3. **GuestPickerPopup**: Selector de cantidad de huéspedes

**Protocolo de búsqueda de ubicaciones** (`src/components/busqueda/search-bar.tsx:397-440`):

```typescript
const fetchResults = useCallback(async (query: string) => {
  if (query.length < 2) { setResultados([]); return }
  
  // 1. Buscar en lista local primero (fallback offline)
  const localResults = searchLocal(query)
  
  // 2. Si hay resultados locales, mostrarlos
  if (localResults.length > 0) {
    setResultados(localResults)
    setOpen(true)
  }
  
  // 3. Llamar API externa para resultados enriquecidos
  const res = await fetch(`/api/ubicaciones?q=${encodeURIComponent(query)}`)
  const data = await res.json()
  // Merge resultados
}, [])
```

**Base de datos de ubicaciones local** (`src/components/busqueda/search-bar.tsx:39-103`):

Incluye todos los estados de Venezuela, ciudades principales y zonas turísticas. El tipo de cada ubicación determina el icono a mostrar.

**Parámetros de búsqueda** (`src/components/busqueda/search-bar.tsx:458-479`):

```typescript
const doSearch = (locationItem?: LocationResult) => {
  const params = new URLSearchParams()
  if (loc) params.set('ubicacion', loc)
  if (lat != null) params.set('lat', String(lat))
  if (lng != null) params.set('lng', String(lng))
  if (lat != null && lng != null) params.set('radio', '25')
  if (dateRange.from) params.set('entrada', formatDate(dateRange.from))
  if (dateRange.to) params.set('salida', formatDate(dateRange.to))
  if (huespedes) params.set('huespedes', huespedes)
  router.push(`/propiedades?${params.toString()}`)
}
```

### 5.2 Búsqueda por Proximidad (Geospatial)

Located in `src/actions/propiedad.actions.ts:268-301`

**Algoritmo Haversine** para calcular distancia:

```typescript
const R = 6371  // Radio de la Tierra en km
const dLat = ((lat - centerLat) * Math.PI) / 180
const dLon = ((lng - centerLng) * Math.PI) / 180
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos((centerLat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2)
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
const dist = R * c  // Distancia en km
```

**Filtro por radio** (`src/actions/propiedad.actions.ts:282-298`):

```typescript
rawResults = rawResults.filter((p) => {
  const lat = p.latitud as number | null
  const lng = p.longitud as number | null
  if (lat == null || lng == null) return false
  // Calcular distancia y filtrar
  return dist <= radioKm  // Default: 25km
})
```

---

## 6. SISTEMA DE RESERVAS

### 6.1 Creación de Reserva

Located in `src/actions/reserva.actions.ts:20-95`

**Protocolo de creación**:

1. **Verificar autenticación**: El usuario debe estar logueado
2. **Validar datos**: Usar `reservaSchema` de Zod
3. **Obtener propiedad**: Verificar que existe y está publicada
4. **Verificar disponibilidad**: Buscar reservas que se solapen
5. **Calcular precios**: Usar función `calcularPrecioReserva`
6. **Crear reserva**: Insertar en DB con estado `PENDIENTE`

**Verificación de disponibilidad** (`src/actions/reserva.actions.ts:54-65`):

```typescript
const reservasExistentes = await prisma.reserva.findMany({
  where: {
    propiedadId: data.propiedadId,
    estado: { in: ['CONFIRMADA', 'PENDIENTE', 'EN_CURSO'] },
    fechaEntrada: { lt: data.fechaSalida },   // La nueva termina después de existente
    fechaSalida: { gt: data.fechaEntrada },   // La nueva empieza antes de existente
  }
})
if (reservasExistentes.length > 0) {
  return { error: 'Las fechas seleccionadas no están disponibles' }
}
```

### 6.2 Cálculo de Precios

Located in `src/lib/calculations.ts:9-28`

```typescript
export function calcularPrecioReserva(
  precioPorNoche: number,
  fechaEntrada: Date,
  fechaSalida: Date
) {
  const noches = calcularNoches(fechaEntrada, fechaSalida)
  const subtotal = precioPorNoche * noches
  const comisionHuesped = Math.round(subtotal * COMISION_PLATAFORMA_HUESPED * 100) / 100
  const comisionAnfitrion = Math.round(subtotal * COMISION_PLATAFORMA_ANFITRION * 100) / 100
  const total = Math.round((subtotal + comisionHuesped) * 100) / 100

  return { noches, precioPorNoche, subtotal, comisionHuesped, comisionAnfitrion, total }
}
```

**Comisiones configurables** (`src/lib/constants.ts:8-9`):
```typescript
COMISION_PLATAFORMA_HUESPED = 0.06  // 6%
COMISION_PLATAFORMA_ANFITRION = 0.03  // 3%
```

### 6.3 Política de Cancelación

Located in `src/lib/calculations.ts:33-56`

**Cálculo de reembolso por política**:

```typescript
case 'FLEXIBLE':
  if (diasAntes >= 1) return { reembolso: total, porcentaje: 100 }
  return { reembolso: 0, porcentaje: 0 }

case 'MODERADA':
  if (diasAntes >= 5) return { reembolso: total, porcentaje: 100 }
  if (diasAntes >= 1) return { reembolso: total * 0.5, porcentaje: 50 }
  return { reembolso: 0, porcentaje: 0 }

case 'ESTRICTA':
  if (diasAntes >= 14) return { reembolso: total, porcentaje: 100 }
  if (diasAntes >= 7) return { reembolso: total * 0.5, porcentaje: 50 }
  return { reembolso: 0, porcentaje: 0 }
```

---

## 7. SISTEMA DE PAGOS

### 7.1 Registro de Pago

Located in `src/actions/pago.actions.ts:18-63`

**Flujo de registro**:

1. Usuario selecciona método de pago
2. Ingresa monto y referencia (si aplica)
3. Se crea registro en estado `PENDIENTE`
4. El anfitrión debe verificar manualmente

### 7.2 Verificación de Pago

Located in `src/actions/pago.actions.ts:68-107`

**Protocolo de verificación**:

```typescript
export async function verificarPago(pagoId: string, aprobado: boolean, notas?: string) {
  // 1. Verificar permisos (solo anfitrión puede verificar)
  if (pago.reserva.propiedad.propietarioId !== user.id) {
    return { error: 'Sin permisos para verificar este pago' }
  }

  // 2. Actualizar estado del pago
  const estado = aprobado ? 'VERIFICADO' : 'RECHAZADO'
  await prisma.pago.update({
    where: { id: pagoId },
    data: { estado, verificadoPor: user.id, notasVerificacion: notas, ... }
  })

  // 3. Si aprobado y reserva pendiente, confirmar reserva
  if (aprobado && pago.reserva.estado === 'PENDIENTE') {
    await prisma.reserva.update({
      where: { id: pago.reservaId },
      data: { estado: 'CONFIRMADA', fechaConfirmacion: new Date() }
    })
  }
}
```

### 7.3 API de Tipo de Cambio

Located in `src/app/api/exchange-rate/route.ts`

El endpoint `/api/exchange-rate` proporciona la cotización del euro para mostrar precios en VES. Se consume en el navbar.

---

## 8. COMPONENTES UI

### 8.1 Arquitectura de Componentes

Los componentes siguen una estructura consistente:

- **Componentes base**: En `src/components/ui/` (Button, Input, Card, etc.)
- **Componentes de feature**: En folders por dominio (`propiedades/`, `busqueda/`, etc.)
- **Componentes compartidos**: En `src/components/shared/`

### 8.2 Property Card

Located in `src/components/propiedades/property-card.tsx`

**Características**:
- Link con `target="_blank"` para abrir en nueva pestaña
- Imagen con `aspect-ratio` y `object-cover`
- Badge de tipo de propiedad
- Rating con estrellas
- Precio formateado según moneda

**Formato de precio** (`src/components/propiedades/property-card.tsx:36-41`):

```typescript
function formatearPrecio(precio: number, moneda: Moneda): string {
  if (moneda === 'USD') {
    return `$${precio.toLocaleString('en-US')}`
  }
  return `Bs. ${precio.toLocaleString('es-VE')}`
}
```

### 8.3 Property Gallery

Located in `src/components/propiedades/property-gallery.tsx`

**Grid responsive**:
- Mobile: Single image con botón "Mostrar todas las fotos"
- Desktop: Grid asimétrico (principal 60%, secundaria 40% en 2 columnas)

**Ordenamiento**: Las imágenes se ordenan por campo `orden` y la principal se determina por flag `es_principal`.

### 8.4 Search Bar

Located in `src/components/busqueda/search-bar.tsx`

**Popup positioning**: Usa `getBoundingClientRect()` para calcular posición relativa al botón que lo Abre.

**Animaciones**: Usa Framer Motion para entrada/salida de popups:
```typescript
<motion.div 
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
>
```

---

## 9. PÁGINAS PRINCIPALES

### 9.1 Landing Page

Located in `src/app/(main)/page.tsx`

Secciones:
- `HeroSection`: Buscador principal
- `ZonasSection`: Destinos populares
- `StepsSection`: Cómo funciona
- `PaymentsSection`: Métodos de pago aceptados
- `CtaSection`: Call to action para anfitriones

### 9.2 Catálogo de Propiedades

Located in `src/app/(main)/propiedades/page.tsx`

Usa Server Component para fetch inicial y client components para filtros.

### 9.3 Detalle de Propiedad

Located in `src/app/(main)/propiedades/[id]/page.tsx`

**Carga de datos** (`src/actions/propiedad.actions.ts:343-416`):

```typescript
export async function getPropiedadPorId(id: string): Promise<PropiedadDetalle | null> {
  // Fetch propiedad con propietario
  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('*, propietario:usuarios!propietario_id(...)')
    .eq('id', id)
    .single()

  // Fetch separado de imágenes
  const { data: imagenes } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('propiedad_id', id)
    .order('orden', { ascending: true })

  // Fetch amenidades
  const { data: amenidadesRaw } = await supabase
    .from('propiedad_amenidades')
    .select('amenidad_id, amenidad:amenidades(...)')
    .eq('propiedad_id', id)

  // Fetch reseñas
  const { data: resenasRaw } = await supabase
    .from('resenas')
    .select('id, calificacion, comentario, fecha_creacion, autor:usuarios!autor_id(...)')
    .eq('propiedad_id', id)
    .order('fecha_creacion', { ascending: false })
    .limit(10)
}
```

---

## 10. PATRONES Y CONSTANTES

### 10.1 Paleta de Colores

```css
/* Colores principales */
--color-primary: #1B4332  /* Verde oscuro - hover states */
--color-secondary: #2D6A4F  /* Verde medio */
--color-accent: #E76F51  /* Naranja - CTAs, search button */
--color-surface: #FEFCF9  /* Fondo principal */
--color-border: #E8E4DF  /* Bordes */
--color-text: #1A1A1A  /* Texto principal */
--color-text-secondary: #6B6560  /* Texto secundario */
```

### 10.2 Constantes del Sistema

Located in `src/lib/constants.ts`

**Límites**:
- `MAX_IMAGENES_PROPIEDAD = 20`
- `MAX_TAMANO_IMAGEN = 5MB`
- `MAX_HUESPEDES_DEFAULT = 16`

**Paginación**:
- `PROPIEDADES_POR_PAGINA = 12`
- `RESENAS_POR_PAGINA = 10`

---

## 11. ÍNDICE DE REFERENCIA RÁPIDA

| Sección | Archivo(s) Clave(s) | Descripción |
|---------|---------------------|-------------|
| 1.1 | `src/app/layout.tsx`, `src/components/providers.tsx` | Configuración raíz |
| 1.2 | Estructura de carpetas | Routes del App Router |
| 2.1 | `prisma/schema.prisma:17-41` | Modelo Usuario |
| 2.2 | `prisma/schema.prisma:54-105` | Modelo Propiedad |
| 2.3 | `prisma/schema.prisma:195-230` | Modelo Reserva |
| 2.4 | `prisma/schema.prisma:246-275` | Modelo Pago |
| 3.1 | `src/actions/auth.actions.ts` | Auth actions |
| 3.2 | `src/middleware.ts` | Protección de rutas |
| 4.1 | `src/lib/supabase/server.ts` | Cliente servidor |
| 4.2 | `src/lib/supabase/admin.ts` | Cliente admin |
| 4.3 | `src/lib/supabase/client.ts` | Cliente navegador |
| 5.1 | `src/components/busqueda/search-bar.tsx` | Componente búsqueda |
| 5.2 | `src/actions/propiedad.actions.ts:268-301` | Búsqueda geográfica |
| 6.1 | `src/actions/reserva.actions.ts:20-95` | Crear reserva |
| 6.2 | `src/lib/calculations.ts:9-28` | Cálculo de precios |
| 6.3 | `src/lib/calculations.ts:33-56` | Cancelaciones |
| 7.1 | `src/actions/pago.actions.ts:18-63` | Registro de pago |
| 7.2 | `src/actions/pago.actions.ts:68-107` | Verificación |
| 8.1 | `src/components/ui/` | Componentes base |
| 8.2 | `src/components/propiedades/property-card.tsx` | Card de propiedad |
| 8.3 | `src/components/propiedades/property-gallery.tsx` | Galería |
| 9.1 | `src/app/(main)/page.tsx` | Landing |
| 9.2 | `src/app/(main)/propiedades/page.tsx` | Catálogo |
| 9.3 | `src/app/(main)/propiedades/[id]/page.tsx` | Detalle |
| 10.1 | `src/lib/constants.ts` | Constantes globales |
| 10.2 | Design tokens | Tailwind config |
