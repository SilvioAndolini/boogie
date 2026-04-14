# Documentación Técnica — Boogie

Plataforma de alquileres vacacionales en Venezuela.

> **Frontend**: Next.js 16 (App Router) en puerto 3000  
> **Backend**: Go + Chi en puerto 8080

---

## 1. Arquitectura General

### 1.1 Arquitectura Dual

El proyecto sigue una **arquitectura de dos componentes**:

```
Browser
    ↓
Next.js (Server Components + Server Actions)
    ↓ (llamadas HTTP al backend Go)
Go Backend (Puerto 8080)
    ↓
PostgreSQL (Supabase)
```

**Responsabilidades**:
- **Frontend (Next.js)**: Renderizado SSR/SSG, UI interactiva, Server Actions para mutations
- **Backend (Go)**: Lógica de negocio pesada, autenticación, acceso a datos, APIs REST

### 1.2 Stack Tecnológico

#### Frontend (TypeScript + Next.js)

| Tecnología | Propósito |
|---|---|
| Next.js 16 (App Router) | Framework fullstack con Server/Client Components |
| TypeScript | Tipado estático |
| Prisma 7 | ORM y generación de tipos |
| Supabase | Base de datos, Auth, Storage |
| Zod | Validación de esquemas |
| Tailwind CSS 4 | Estilos utility-first |
| Framer Motion | Animaciones |
| MapLibre GL | Mapas |
| Recharts | Gráficos |

#### Backend (Go)

| Tecnología | Propósito |
|---|---|
| Go 1.24+ | Runtime |
| Chi v5 | Router HTTP |
| pgx/v5 | Driver PostgreSQL |
| JWT (golang-jwt) | Autenticación con Supabase |
| rs/cors | CORS middleware |
| testify | Testing |

### 1.3 Estructura de Carpetas

```
boogie/
├── src/                      # Frontend Next.js
│   ├── app/                 # Rutas del App Router
│   ├── actions/             # Server Actions
│   ├── components/          # Componentes React
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilidades y servicios
│   ├── types/              # Tipos TypeScript
│   └── generated/          # Tipos Prisma (auto-generado)
│
├── backend/                  # Backend Go
│   ├── cmd/server/          # Entry point
│   └── internal/
│       ├── auth/            # Autenticación Supabase
│       ├── config/          # Configuración
│       ├── domain/          # Models y Enums
│       ├── handler/         # HTTP handlers
│       ├── repository/      # Acceso a datos
│       ├── router/          # Definición de rutas
│       └── service/         # Lógica de negocio
│
├── prisma/                  # Schema Prisma
├── supabase/                # Migraciones SQL
└── docs/                    # Documentación adicional
```

---

## 2. Backend Go — Arquitectura

### 2.1 Capas (Layered Architecture)

```
handler/    → HTTP handlers (receiben requests, retornan JSON)
    ↓
service/    → Lógica de negocio (cálculos, validaciones)
    ↓
repository/ → Acceso a datos (queries SQL con pgx)
    ↓
database    → PostgreSQL via pgx pool
```

### 2.2 Domain Models (`internal/domain/models/`)

```go
type Usuario struct {
    ID             string
    Email          string
    Nombre         string
    Apellido       string
    TipoDocumento  string
    NumeroDocumento string
    Telefono       *string
    FotoURL        *string
    Verificado     bool
    Rol            enums.Rol
    PlanSuscripcion enums.PlanSuscripcion
    Reputacion     float64
    // ...
}

type Propiedad struct {
    ID              string
    PropietarioID   string
    Titulo          string
    Slug            string
    TipoPropiedad   enums.TipoPropiedad
    PrecioPorNoche  float64
    Moneda          enums.Moneda
    Estado          enums.EstadoPublicacion
    Ubicacion       string
    Latitud/Longitud float64
    Imagenes        []ImagenPropiedad
    // ...
}
```

### 2.3 Enums (`internal/domain/enums/`)

```go
type Rol string           // BOOGER, ANFITRION, AMBOS, ADMIN
type Moneda string        // USD, VES
type EstadoReserva string // PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA_*, RECHAZADA
type EstadoPago string    // PENDIENTE, EN_VERIFICACION, VERIFICADO, ACREDITADO, RECHAZADO, REEMBOLSADO
type MetodoPagoEnum string // TRANSFERENCIA_BANCARIA, PAGO_MOVIL, ZELLE, USDT, etc.
type PoliticaCancelacion string // FLEXIBLE, MODERADA, ESTRICTA
type PlanSuscripcion string // FREE, BASICO, PREMIUM
```

### 2.4 Repository (`internal/repository/`)

Acceso directo a PostgreSQL con queries parametrizadas:

```go
type PropiedadesRepo struct {
    pool *pgxpool.Pool
}

func (r *PropiedadesRepo) Search(ctx context.Context, p *SearchParams) ([]models.Propiedad, error)
func (r *PropiedadesRepo) GetByID(ctx context.Context, id string) (*models.Propiedad, error)
func (r *PropiedadesRepo) GetBySlug(ctx context.Context, slug string) (*models.Propiedad, error)
func (r *PropiedadesRepo) MisPropiedades(ctx context.Context, usuarioID string) ([]models.Propiedad, error)
func (r *PropiedadesRepo) UpdateEstado(ctx context.Context, id string, estado enums.EstadoPublicacion) error
func (r *PropiedadesRepo) Delete(ctx context.Context, id string) error
```

**Queries en** `internal/repository/queries/`:
- Archivos `.sql` con queries nombradas
- Cargadas al iniciar el repository

### 2.5 Services (`internal/service/`)

```go
type ReservaService struct {
    repo      *repository.ReservaRepo
    comisionH float64  // 0.06
    comisionA float64  // 0.03
}

func (s *ReservaService) Crear(ctx context.Context, r *CrearReservaInput) (*models.Reserva, error)
func (s *ReservaService) GetByID(ctx context.Context, id string) (*models.Reserva, error)
func (s *ReservaService) Confirmar(ctx context.Context, id string) error
func (s *ReservaService) Rechazar(ctx context.Context, id string) error
func (s *ReservaService) Cancelar(ctx context.Context, id string, motivo string) error

type PagoService struct {
    repo *repository.PagoRepo
}

type CryptoService struct {
    config  CryptapiConfig
    comisionH float64
    comisionA float64
}
```

### 2.6 Handlers (`internal/handler/`)

```go
type AuthHandler struct {
    authClient  *auth.SupabaseAuthClient
    verifier    *auth.SupabaseVerifier
    authRepo    *repository.AuthRepo
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request)
func (h *AuthHandler) SendOtpEmail(w http.ResponseWriter, r *http.Request)
func (h *AuthHandler) VerifyOtp(w http.ResponseWriter, r *http.Request)
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request)
```

### 2.7 Middleware (`internal/handler/middleware.go`)

```go
func LoggingMiddleware(next http.Handler) http.Handler
func RecoveryMiddleware(next http.Handler) http.Handler
func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler
```

---

## 3. Autenticación

### 3.1 Flujo de Auth (Go Backend)

El backend implementa autenticación completa con Supabase:

```
1. Login → Supabase Auth (email/password)
2. OTP → Supabase Auth (envío de código)
3. JWT → Verificación con JWKS de Supabase
```

### 3.2 Supabase Verifier (`internal/auth/supabase.go`)

```go
type SupabaseVerifier struct {
    supabaseURL string
    jwksURL     string  // https://[project].supabase.co/auth/v1/jwks
}

func (v *SupabaseVerifier) Middleware(next http.Handler) http.Handler {
    // Extrae Bearer token del header
    // Valida JWT contra JWKS de Supabase
    // Añade user info al context
}
```

### 3.3 Rutas Protegidas

Las rutas `/api/v1/*` (excepto públicas) requieren header `Authorization: Bearer <token>`.

```go
r.Group(func(r chi.Router) {
    r.Use(opts.AuthVerifier.Middleware)
    // Rutas protegidas aquí
})
```

---

## 4. API Routes (Go)

### 4.1 Rutas Principales

Todas las rutas están bajo `/api/v1/`:

```
/api/v1/auth/*          → Autenticación
/api/v1/reservas/*      → Reservas
/api/v1/pagos/*         → Pagos
/api/v1/wallet/*        → Boogie Wallet
/api/v1/propiedades/*   → Propiedades
/api/v1/resenas/*       → Reseñas
/api/v1/verificacion/*  → Verificación de identidad
/api/v1/chat/*          → Chat
/api/v1/ofertas/*       → Ofertas especiales
/api/v1/tienda/*        → Boogie Store
/api/v1/admin/*         → Panel admin (requiere rol ADMIN)
/api/v1/exchange-rate   → Tipo de cambio (rate limited)
/api/v1/ubicaciones     → Búsqueda de ubicaciones (rate limited)
```

### 4.2 Rate Limiting

- `/exchange-rate`: 60 requests/minuto por IP
- `/ubicaciones`: 30 requests/2segundo por IP

### 4.3 CORS

Configurado para permitir solo el origen de `APP_URL`.

---

## 5. Modelo de Datos

### 5.1 Entidades Principales

```
Usuario ─────────┬── Propiedad (1:N) ──── ImagenPropiedad (1:N)
  rol: BOOGER /  │                    ├── Reserva (1:N)
  ANFITRION /    │                    ├── FechaBloqueada (1:N)
  AMBOS / ADMIN  │                    └── PrecioEspecial (1:N)
                  │
                  ├── Reserva (1:N como huésped)
                  │      ├── Pago (1:N)
                  │      └── ReservaStoreItem (1:N)
                  │
                  ├── Resena (1:N)
                  ├── MetodoPago (1:N)
                  ├── Notificacion (1:N)
                  ├── Wallet (1:1) ──── WalletTransaccion (1:N)
                  └── VerificacionDocumento (1:1)
```

### 5.2 Enums en Go

```go
type Rol string             // BOOGER, ANFITRION, AMBOS, ADMIN
type PlanSuscripcion string // FREE, BASICO, PREMIUM
type Moneda string          // USD, VES
type EstadoPublicacion string // BORRADOR, PENDIENTE_REVISION, PUBLICADA, PAUSADA, SUSPENDIDA
type EstadoReserva string   // PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA_HUESPED, CANCELADA_ANFITRION, RECHAZADA
type EstadoPago string      // PENDIENTE, EN_VERIFICACION, VERIFICADO, ACREDITADO, RECHAZADO, REEMBOLSADO
type MetodoPagoEnum string  // TRANSFERENCIA_BANCARIA, PAGO_MOVIL, ZELLE, EFECTIVO_FARMATODO, USDT, TARJETA_INTERNACIONAL, CRIPTO, EFECTIVO
type PoliticaCancelacion string // FLEXIBLE, MODERADA, ESTRICTA
type TipoPropiedad string   // APARTAMENTO, CASA, HABITACION, LOFT, CHALET, OTRO
```

---

## 6. Cálculo de Precios

### 6.1 Fórmula de Reserva

```go
subtotal = precioPorNoche * noches
comisionHuesped = subtotal * 0.06  // 6%
comisionAnfitrion = subtotal * 0.03 // 3%
total = subtotal + comisionHuesped
```

### 6.2 Reembolso por Cancelación

| Política | Dias antes | Reembolso |
|---|---|---|
| FLEXIBLE | ≥ 1 día | 100% |
| MODERADA | ≥ 5 días | 100% |
| MODERADA | ≥ 1 día | 50% |
| ESTRICTA | ≥ 14 días | 100% |
| ESTRICTA | ≥ 7 días | 50% |

---

## 7. Frontend — Server Actions

### 7.1 Ubicación

Todas las Server Actions están en `src/actions/`:

```
src/actions/
├── auth.actions.ts           # Login, registro, OTP
├── auth-google.actions.ts    # OAuth Google
├── propiedad.actions.ts      # CRUD propiedades
├── reserva.actions.ts        # Reservas
├── pago.actions.ts           # Pagos
├── wallet.actions.ts         # Wallet
├── review.actions.ts         # Reseñas
├── admin-*.actions.ts        # Admin
└── ...
```

### 7.2 Estructura de una Server Action

```typescript
'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function miAccion(datos: MiInput) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: { mensaje: 'No autenticado' } }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('tabla').insert(datos)

  if (error) return { error: { mensaje: error.message } }
  return { exito: true, datos }
}
```

---

## 8. Flujos Principales

### 8.1 Reserva (4 pasos en Frontend)

1. **Resumen**: Selección de fechas, noches, desglose de precios
2. **Boogie Store**: Productos/servicios adicionales (opcional)
3. **Pago**: Selección de método + formulario
4. **Confirmación**: Reserva creada, pago en verificación

Backend: `POST /api/v1/reservas` crea la reserva en estado `PENDIENTE`.

### 8.2 Pago USDT (CryptAPI)

1. Frontend llama `POST /api/v1/crypto/create` (auth requerida)
2. Backend genera dirección de depósito con CryptAPI
3. Usuario envía USDT TRC20
4. CryptAPI llama callback `GET /api/v1/crypto/callback`
5. Backend verifica y actualiza pago a `ACREDITADO`

### 8.3 Verificación MetaMap

1. Frontend llama `POST /api/v1/verificacion/iniciar-metamap`
2. Backend crea sesión en MetaMap, retorna URL
3. Usuario completa en MetaMap
4. MetaMap llama webhook `POST /api/v1/metamap/webhook`
5. Backend actualiza `verificacion_documento`

---

## 9. Testing

### Backend (Go)

```bash
go test ./...              # Todos los tests
go test -v ./internal/handler  # Tests de handlers
```

### Frontend (Vitest)

```bash
npm run test
npm run test:watch
```

---

## 10. Configuración de Entorno

### Backend (Go)

```bash
PORT=8080
APP_URL=http://localhost:3000
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SECRET_KEY=[service_role_key]
DATABASE_URL=postgres://[user]:[password]@[host]:[port]/[db]
CRYPTAPI_WALLET_ADDRESS=[wallet]
CRYPTAPI_CALLBACK_SECRET=[secret]
METAMAP_WEBHOOK_SECRET=[secret]
COMISION_PLATAFORMA_HUESPED=0.06
COMISION_PLATAFORMA_ANFITRION=0.03
```

### Frontend (Next.js)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SECRET_KEY=[service_role_key]
DATABASE_URL=postgres://...
```

---

## 11. Índice de Referencia

| Componente | Archivo | Descripción |
|---|---|---|
| Entry point | `backend/cmd/server/main.go` | Inicialización del servidor Go |
| Router | `backend/internal/router/router.go` | Todas las rutas de la API |
| Auth | `backend/internal/auth/supabase.go` | Verificación JWT/JWKS |
| Models | `backend/internal/domain/models/models.go` | Structs de datos |
| Enums | `backend/internal/domain/enums/enums.go` | Constantes de tipo |
| Config | `backend/internal/config/config.go` | Carga de env vars |
| Server Actions | `src/actions/*.actions.ts` | Mutaciones desde frontend |
| Prisma Schema | `prisma/schema.prisma` | Schema de la base de datos |