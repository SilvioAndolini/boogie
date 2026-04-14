# Boogie

**Plataforma de alquileres vacacionales en Venezuela**

Tu hogar lejos de casa. Boogie conecta anfitriones y huéspedes en toda Venezuela con procesamiento de pagos local (Pago Móvil, Zelle, transferencia bancaria, USDT y más).

> **Producción**: [boogierent.com](https://www.boogierent.com)

---

## Arquitectura

El proyecto tiene una arquitectura de dos componentes:

| Componente | Stack | Descripción |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | Aplicación web full-stack con React |
| **Backend** | Go + Chi | API REST para lógica de negocio pesada |

### Flujo de datos

```
Browser → Next.js (Server Actions/API Routes)
              ↓
         Go Backend (Puerto 8080)
              ↓
         PostgreSQL (Supabase)
```

---

## Stack Tecnológico

### Frontend (Next.js)

| Tecnología | Propósito |
|---|---|
| Next.js 16 (App Router) | Framework fullstack con SSR/SSG |
| TypeScript | Tipado estático estricto |
| Tailwind CSS 4 | Estilos utilitarios |
| Base UI + Radix UI + shadcn | Componentes accesibles |
| Supabase (PostgreSQL) | Base de datos + Auth + Storage |
| Prisma 7 | ORM y generación de tipos |
| Zod | Validación de esquemas |
| Framer Motion | Animaciones |
| MapLibre GL | Mapas interactivos |
| Recharts | Gráficos y charts |
| Vitest + Playwright | Tests unitarios y E2E |

### Backend (Go)

| Tecnología | Propósito |
|---|---|
| Go 1.24+ | Runtime del API server |
| Chi v5 | Router HTTP minimalist |
| pgx/v5 | Driver PostgreSQL |
| JWT | Autenticación con Supabase |
| rs/cors | CORS middleware |

---

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Go 1.24+
- npm 10+
- Cuenta en Supabase (gratis)

### Instalación Frontend

```bash
npm install
cp .env.example .env.local   # Editar con credenciales de Supabase
npm run postinstall           # Generar cliente Prisma
npm run db:seed               # Seed de amenidades básicas
npm run dev                   # http://localhost:3000
```

### Instalación Backend

```bash
cd backend
go mod download
go run cmd/server/main.go    # http://localhost:8080
```

### Variables de Entorno Esenciales

**Frontend** (`.env.local`):
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública (anon/publishable) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Key pública para SSR |
| `SUPABASE_SECRET_KEY` | Service role key (solo backend, **nunca exponer al cliente**) |
| `DATABASE_URL` | Connection string PostgreSQL |

**Backend** (variables de entorno o `.env` en carpeta `backend/`):
| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 8080) |
| `APP_URL` | URL de la app frontend (para CORS) |
| `SUPABASE_URL` | URL de Supabase |
| `SUPABASE_SECRET_KEY` | Service role key |
| `DATABASE_URL` | Connection string PostgreSQL |

### Scripts Disponibles

**Frontend:**
```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build de producción (genera Prisma + compila Next)
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run format       # Formateo con Prettier
npm run test         # Tests unitarios (Vitest)
npm run db:migrate   # Crear migración Prisma
npm run db:push      # Push schema sin migración
npm run db:seed      # Ejecutar seed
npm run db:studio    # Prisma Studio (visualizador de BD)
```

**Backend:**
```bash
cd backend
go run cmd/server/main.go   # Ejecutar servidor
go build ./...              # Compilar
go test ./...              # Tests
```

---

## Arquitectura del Proyecto

### Frontend (`/`)

```
src/
├── app/                    # Rutas del App Router de Next.js
│   ├── (auth)/             # Rutas de autenticación (login, registro, etc.)
│   ├── (main)/             # Rutas públicas (landing, propiedades, zonas)
│   ├── (panel)/            # Dashboard del usuario (protegido)
│   ├── (admin)/            # Panel de administración (protegido, rol ADMIN)
│   ├── api/                # API Routes (exchange rate, webhooks, etc.)
│   ├── layout.tsx          # Root layout (providers, fonts, metadata)
│   ├── template.tsx        # Page transition wrapper (client)
│   ├── error.tsx           # Error boundary global
│   └── not-found.tsx       # Página 404
│
├── actions/                # Server Actions (~25 archivos, ~100 funciones)
│
├── components/             # Componentes React organizados por feature
│   ├── ui/                 # Primitivos de UI (Button, Card, Input, Dialog, etc.)
│   ├── admin/              # Componentes del panel admin
│   ├── busqueda/           # Barra de búsqueda
│   ├── landing/            # Secciones de la landing page
│   ├── layout/             # Navbar, Sidebar, Footer
│   ├── pagos/              # Formularios y selectores de pago
│   ├── propiedades/        # Cards, galería, filtros, mapas
│   ├── reservas/           # Booking widget, calendario, Boogie Store
│   ├── shared/             # Componentes reutilizables genéricos
│   └── providers.tsx       # Wrapper de providers del cliente
│
├── hooks/                  # Custom hooks (useDebounce, useMediaQuery, etc.)
├── lib/                    # Utilidades, lógica de negocio, servicios
│   ├── crypto/             # Integración con CryptAPI (USDT)
│   ├── reservas/           # Lógica de reservas (cálculos, disponibilidad, estados)
│   ├── services/           # Servicios externos (exchange rate)
│   └── supabase/           # Clientes Supabase (server, admin, browser)
├── types/                  # Definiciones de tipos TypeScript
└── generated/              # Tipos generados por Prisma (no editar a mano)
```

### Backend (`/backend`)

```
backend/
├── cmd/
│   └── server/
│       └── main.go         # Entry point
│
├── internal/
│   ├── auth/               # Autenticación Supabase (JWKS verification)
│   ├── config/            # Carga de configuración desde env
│   ├── domain/
│   │   ├── enums/         # Enums: Rol, EstadoReserva, MetodoPago, etc.
│   │   └── models/        # Structs: Usuario, Propiedad, Reserva, Pago, etc.
│   ├── handler/           # HTTP handlers (auth, pagos, reservas, admin)
│   │   ├── middleware.go  # Logging, recovery, rate limiting
│   │   ├── response.go    # Helpers JSON responses
│   │   └── *_test.go      # Tests de handlers
│   ├── repository/        # Acceso a datos (queries SQL directas con pgx)
│   │   ├── db.go         # Pool de conexión PostgreSQL
│   │   ├── queries/      # Queries SQL parametrizadas
│   │   └── *_repo.go     # Repos por entidad
│   ├── router/           # Configuración de rutas Chi
│   │   └── router.go     # Definición de todas las rutas /api/v1/*
│   └── service/          # Lógica de negocio
│       ├── auth_service.go
│       ├── propiedades_service.go
│       ├── reserva_service.go
│       ├── pago_service.go
│       ├── crypto_service.go
│       └── admin_service.go
│
├── go.mod
└── go.sum
```

---

## API Endpoints (Backend Go)

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Login email/password |
| POST | `/api/v1/auth/login-admin` | Login exclusivo admins |
| POST | `/api/v1/auth/otp/email` | Enviar OTP por email |
| POST | `/api/v1/auth/otp/sms` | Enviar OTP por SMS |
| POST | `/api/v1/auth/otp/verify` | Verificar OTP y registrar |
| POST | `/api/v1/auth/register` | Registro directo |
| POST | `/api/v1/auth/reset-password` | Recuperar contraseña |
| GET | `/api/v1/auth/google` | URL OAuth Google |
| GET | `/api/v1/auth/google/callback` | Callback OAuth Google |
| POST | `/api/v1/auth/completar-perfil` | Completar perfil post-OAuth |
| GET | `/api/v1/auth/me` | Usuario autenticado |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/reservas/disponibilidad` | Verificar disponibilidad |
| POST | `/api/v1/reservas` | Crear reserva |
| GET | `/api/v1/reservas/mias` | Mis reservas (huésped) |
| GET | `/api/v1/reservas/recibidas` | Reservas recibidas (anfitrión) |
| GET | `/api/v1/reservas/{id}` | Detalle de reserva |
| POST | `/api/v1/reservas/{id}/cancelar` | Cancelar reserva |
| POST | `/api/v1/reservas/{id}/confirmar` | Confirmar reserva |
| POST | `/api/v1/reservas/{id}/rechazar` | Rechazar reserva |

### Pagos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/pagos/registrar` | Registrar pago simple |
| POST | `/api/v1/pagos/registrar-comprobante` | Registrar con comprobante |
| POST | `/api/v1/pagos/{id}/verificar` | Verificar pago |
| GET | `/api/v1/pagos/mis-pagos` | Historial de pagos |
| GET | `/api/v1/payment-data` | Datos de cuentas de pago |
| POST | `/api/v1/payments/card/create` | Crear pago con tarjeta |
| GET | `/api/v1/payments/card/callback` | Callback de tarjeta |

### Wallet

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/wallet/` | Obtener wallet del usuario |
| POST | `/api/v1/wallet/activar` | Activar wallet |
| POST | `/api/v1/wallet/recarga` | Crear recarga |
| GET | `/api/v1/wallet/{walletId}/transacciones` | Historial de transacciones |

### Propiedades

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/propiedades/publicas` | Búsqueda pública con filtros |
| GET | `/api/v1/propiedades/buscar` | Búsqueda avanzada |
| GET | `/api/v1/propiedades/{id}` | Detalle de propiedad |
| GET | `/api/v1/propiedades/mias` | Mis propiedades (anfitrión) |
| PATCH | `/api/v1/propiedades/{id}/estado` | Cambiar estado de publicación |
| DELETE | `/api/v1/propiedades/{id}` | Eliminar propiedad |

### Reseñas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/resenas` | Crear reseña |
| POST | `/api/v1/resenas/{id}/responder` | Responder reseña |
| GET | `/api/v1/propiedades/{propiedadId}/resenas` | Listar reseñas de propiedad |

### Verificación

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/verificacion` | Estado de verificación del usuario |
| POST | `/api/v1/verificacion/iniciar-metamap` | Iniciar verificación MetaMap |
| POST | `/api/v1/verificacion/subir-documento` | Subir documento manual |
| GET | `/api/v1/admin/verificaciones` | Listar todas (admin) |
| POST | `/api/v1/admin/verificaciones/{id}/revisar` | Revisar verificación |
| GET | `/api/v1/admin/counts` | Estadísticas de verificaciones |

### Chat y Ofertas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/chat/conversaciones` | Listar conversaciones |
| POST | `/api/v1/chat/conversaciones` | Crear/obtener conversación |
| GET | `/api/v1/chat/mensajes` | Mensajes de conversación |
| POST | `/api/v1/chat/mensajes` | Enviar mensaje |
| GET | `/api/v1/chat/no-leidos` | Contar mensajes no leídos |
| POST | `/api/v1/ofertas` | Crear oferta |
| POST | `/api/v1/ofertas/{id}/responder` | Responder oferta |
| GET | `/api/v1/ofertas/recibidas` | Ofertas recibidas |
| GET | `/api/v1/ofertas/enviadas` | Ofertas enviadas |

### Tienda (Boogie Store)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/tienda/productos` | Productos públicos |
| GET | `/api/v1/tienda/servicios` | Servicios públicos |
| GET | `/api/v1/admin/tienda/productos` | Todos los productos (admin) |
| GET | `/api/v1/admin/tienda/servicios` | Todos los servicios (admin) |
| POST | `/api/v1/admin/store/productos` | Crear producto |
| PATCH | `/api/v1/admin/store/productos/{id}` | Actualizar producto |
| DELETE | `/api/v1/admin/store/productos/{id}` | Eliminar producto |
| POST | `/api/v1/admin/store/servicios` | Crear servicio |
| PATCH | `/api/v1/admin/store/servicios/{id}` | Actualizar servicio |
| DELETE | `/api/v1/admin/store/servicios/{id}` | Eliminar servicio |

### Admin

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/dashboard` | Dashboard con KPIs |
| GET | `/api/v1/admin/reservas` | Gestión de reservas |
| GET | `/api/v1/admin/reservas/stats` | Estadísticas de reservas |
| POST | `/api/v1/admin/reservas/accion` | Acción sobre reserva |
| GET | `/api/v1/admin/reservas/{id}` | Detalle de reserva |
| GET | `/api/v1/admin/pagos` | Gestión de pagos |
| GET | `/api/v1/admin/pagos/stats` | Estadísticas de pagos |
| POST | `/api/v1/admin/pagos/verificar` | Verificar pago |
| GET | `/api/v1/admin/propiedades` | Gestión de propiedades |
| GET | `/api/v1/admin/propiedades/ciudades` | Ciudades con propiedades |
| GET | `/api/v1/admin/propiedades/{id}` | Detalle de propiedad |
| GET | `/api/v1/admin/propiedades/{id}/ingresos` | Ingresos de propiedad |
| PATCH | `/api/v1/admin/propiedades` | Actualizar propiedad |
| DELETE | `/api/v1/admin/propiedades/{id}` | Eliminar propiedad |
| GET | `/api/v1/admin/resenas` | Gestión de reseñas |
| POST | `/api/v1/admin/resenas/moderar` | Moderar reseña |
| GET | `/api/v1/admin/usuarios` | Gestión de usuarios |
| POST | `/api/v1/admin/usuarios` | Crear usuario |
| PATCH | `/api/v1/admin/usuarios/{id}` | Actualizar usuario |
| DELETE | `/api/v1/admin/usuarios/{id}` | Eliminar usuario |
| GET | `/api/v1/admin/cupones` | Listar cupones |
| GET | `/api/v1/admin/cupones/{id}` | Detalle de cupón |
| POST | `/api/v1/admin/cupones` | Crear cupón |
| PUT | `/api/v1/admin/cupones` | Editar cupón |
| PATCH | `/api/v1/admin/cupones/{id}/activo` | Activar/desactivar cupón |
| DELETE | `/api/v1/admin/cupones/{id}` | Eliminar cupón |
| GET | `/api/v1/admin/cupon-usos` | Usos de cupones |
| GET | `/api/v1/admin/comisiones` | Ver comisiones |
| PUT | `/api/v1/admin/comisiones` | Actualizar comisiones |
| GET | `/api/v1/admin/auditoria` | Log de auditoría |
| GET | `/api/v1/admin/notificaciones` | Notificaciones |
| POST | `/api/v1/admin/notificaciones` | Enviar notificación |

### Servicios públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/exchange-rate` | Cotización EUR/VES (rate limited) |
| GET | `/api/v1/ubicaciones` | Búsqueda de ubicaciones (rate limited) |
| GET | `/healthz` | Health check |

### Webhooks

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/crypto/create` | Crear dirección USDT (auth requerida) |
| GET | `/api/v1/crypto/callback` | Callback CryptAPI |
| POST | `/api/v1/crypto/callback` | Callback CryptAPI (POST) |
| POST | `/api/v1/metamap/webhook` | Webhook MetaMap |

---

## Mapa de Rutas Frontend

### Rutas Públicas `(main)`

| Ruta | Descripción |
|---|---|
| `/` | Landing page (hero, zonas, CTAs) |
| `/propiedades` | Catálogo con filtros y paginación |
| `/propiedades/[slug]` | Detalle de propiedad |
| `/propiedades/[slug]/reservar` | Flujo de reserva (4 pasos) |
| `/propiedades/buscar` | Búsqueda avanzada |
| `/zonas` | Exploración por estados |
| `/zonas/[slug]` | Propiedades de un estado |
| `/como-funciona` | Cómo funciona Boogie |
| `/nosotros` | Sobre nosotros |
| `/guia-anfitrion` | Guía para anfitriones |

### Rutas de Autenticación `(auth)`

| Ruta | Descripción |
|---|---|
| `/login` | Login con email/password |
| `/registro` | Registro con verificación OTP |
| `/admin-login` | Login exclusivo de admins |
| `/verificar-email` | Verificación de email post-registro |
| `/recuperar-contrasena` | Recuperación por email |
| `/completar-perfil` | Completar perfil post-Google OAuth |

### Dashboard de Usuario `(panel)`

| Ruta | Descripción |
|---|---|
| `/dashboard` | Panel principal con métricas |
| `/dashboard/perfil` | Editar perfil y avatar |
| `/dashboard/mis-propiedades` | Lista de propiedades del anfitrión |
| `/dashboard/mis-propiedades/nueva` | Crear propiedad (formulario multi-paso) |
| `/dashboard/mis-propiedades/[id]` | Detalle y estadísticas de propiedad |
| `/dashboard/mis-propiedades/[id]/editar` | Editar propiedad |
| `/dashboard/mis-reservas` | Reservas como huésped |
| `/dashboard/mis-reservas/[id]` | Detalle de reserva |
| `/dashboard/reservas-recibidas` | Reservas como anfitrión |
| `/dashboard/pagos` | Historial de pagos |
| `/dashboard/pagos/configuracion` | Configurar métodos de pago |
| `/dashboard/pagos/configuracion/wallet` | Boogie Wallet |
| `/dashboard/verificar-identidad` | Verificación de identidad |

### Panel de Administración `(admin)`

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard con KPIs globales |
| `/admin/propiedades` | Gestión de propiedades |
| `/admin/reservas` | Gestión de reservas |
| `/admin/usuarios` | Gestión de usuarios y roles |
| `/admin/pagos` | Verificación de pagos |
| `/admin/resenas` | Moderación de reseñas |
| `/admin/verificaciones` | Verificaciones de identidad |
| `/admin/boogie-store` | Gestión del store |
| `/admin/secciones` | Secciones destacadas (landing) |
| `/admin/cupones` | Gestión de cupones |
| `/admin/auditoria` | Log de auditoría |
| `/admin/configuracion` | Configuración global |

---

## Modelo de Datos

La base de datos usa PostgreSQL en Supabase. Los tipos se generan con Prisma en `src/generated/prisma/models/`.

### Entidades Principales

```
Usuario ─────────┬── Propiedad (1:N) ──── ImagenPropiedad (1:N)
  rol: BOOGER /  │                    ├── PropiedadAmenidad (N:M via Amenidad)
  ANFITRION /    │                    ├── Reserva (1:N)
  AMBOS / ADMIN  │                    ├── FechaBloqueada (1:N)
                  │                    └── PrecioEspecial (1:N)
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

### Enums Clave

| Enum | Valores |
|---|---|
| `Rol` | `BOOGER`, `ANFITRION`, `AMBOS`, `ADMIN` |
| `EstadoPublicacion` | `BORRADOR`, `PENDIENTE_REVISION`, `PUBLICADA`, `PAUSADA`, `SUSPENDIDA` |
| `EstadoReserva` | `PENDIENTE`, `CONFIRMADA`, `EN_CURSO`, `COMPLETADA`, `CANCELADA_HUESPED`, `CANCELADA_ANFITRION`, `RECHAZADA` |
| `EstadoPago` | `PENDIENTE`, `EN_VERIFICACION`, `VERIFICADO`, `ACREDITADO`, `RECHAZADO`, `REEMBOLSADO` |
| `MetodoPagoEnum` | `TRANSFERENCIA_BANCARIA`, `PAGO_MOVIL`, `ZELLE`, `EFECTIVO_FARMATODO`, `USDT`, `TARJETA_INTERNACIONAL`, `CRIPTO`, `EFECTIVO` |
| `PoliticaCancelacion` | `FLEXIBLE`, `MODERADA`, `ESTRICTA` |
| `Moneda` | `USD`, `VES` |

---

## Paleta de Colores y Diseño

| Color | Hex | Uso |
|---|---|---|
| Primario | `#1B4332` | Botones principales, headings, accents |
| Primario medio | `#2D6A4F` | Hover states |
| Primario claro | `#52B788` | Checks, success, badges |
| Primario pastel | `#D8F3DC` | Backgrounds suaves, badges |
| Accent | `#E76F51` | CTAs, botón de búsqueda |
| Fondo | `#FEFCF9` | Fondo general |
| Superficie | `#FFFFFF` | Cards, modales |
| Borde | `#E8E4DF` | Bordes, separadores, dividers |
| Texto | `#1A1A1A` | Texto principal |
| Texto secundario | `#6B6560` | Labels, descripciones |
| Texto terciario | `#9E9892` | Placeholders, hints |

---

## Deployment

### Frontend (Vercel)

Desplegado en **Vercel** con deployment automático desde la rama `master`.

```bash
npm run build   # Genera Prisma + compila Next
```

### Backend (Go)

El backend se ejecuta como un servicio separado en el puerto 8080.

**Variables de entorno requeridas:**
- `PORT` (default: 8080)
- `APP_URL` (URL del frontend para CORS)
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`

---

## Testing

### Frontend (Vitest)

```bash
npm run test         # Tests unitarios
npm run test:watch   # Modo watch
```

Tests en `src/__tests__/` covering:
- Server actions
- Auth y middleware
- Lógica de reservas
- Validaciones Zod

### Backend (Go)

```bash
cd backend
go test ./...         # Todos los tests
go test -v ./...      # Verbose
```

Tests en `backend/internal/**/*_test.go` covering:
- Handlers
- Services
- Repository logic

---

## Licencia

Privado - Todos los derechos reservados.