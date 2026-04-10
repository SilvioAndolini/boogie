# Boogie

**Plataforma de alquileres vacacionales en Venezuela**

Tu hogar lejos de casa. Boogie conecta anfitriones y huéspedes en toda Venezuela con procesamiento de pagos local (Pago Móvil, Zelle, transferencia bancaria, USDT y más).

> **Producción**: [boogierent.com](https://www.boogierent.com)

---

## Stack Tecnológico

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

---

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- npm 10+
- Cuenta en Supabase (gratis)

### Instalación

```bash
npm install
cp .env.example .env.local   # Editar con credenciales de Supabase
npm run postinstall           # Generar cliente Prisma
npm run db:seed               # Seed de amenidades básicas
npm run dev                   # http://localhost:3000
```

### Variables de Entorno Esenciales

Ver `.env.example` para la lista completa.

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública (anon/publishable) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Key pública para SSR |
| `SUPABASE_SECRET_KEY` | Service role key (solo backend, **nunca exponer al cliente**) |
| `DATABASE_URL` | Connection string PostgreSQL |

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build de producción (genera Prisma + compila Next)
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run format       # Formateo con Prettier
npm run test         # Tests unitarios (Vitest)
npm run test:watch   # Tests en modo watch
npm run db:migrate   # Crear migración Prisma
npm run db:push      # Push schema sin migración
npm run db:seed      # Ejecutar seed
npm run db:studio    # Prisma Studio (visualizador de BD)
```

---

## Arquitectura del Proyecto

```
src/
├── app/                    # Rutas del App Router de Next.js
│   ├── (auth)/             # Rutas de autenticación (login, registro, etc.)
│   ├── (main)/             # Rutas públicas (landing, propiedades, zonas)
│   ├── (panel)/            # Dashboard del usuario (protegido)
│   ├── (admin)/            # Panel de administración (protegido, rol ADMIN)
│   ├── api/                # API Routes (webhooks, exchange rate, etc.)
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

> **Nota**: Los grupos de rutas entre paréntesis `(auth)`, `(main)`, `(panel)`, `(admin)` comparten layouts. No afectan la URL.

---

## Mapa de Rutas

### Rutas Públicas `(main)`

| Ruta | Componente | Tipo | Descripción |
|---|---|---|---|
| `/` | `page.tsx` | Server | Landing page (hero, zonas, CTAs) |
| `/propiedades` | `page.tsx` | Server | Catálogo con filtros y paginación |
| `/propiedades/[id]` | `page.tsx` | Server | Detalle de propiedad |
| `/propiedades/[id]/reservar` | `page.tsx` | Client | Flujo de reserva (4 pasos) |
| `/propiedades/buscar` | `page.tsx` | Server | Búsqueda avanzada |
| `/zonas` | `page.tsx` | Server | Exploración por estados |
| `/zonas/[slug]` | `page.tsx` | Server | Propiedades de un estado |
| `/como-funciona` | `page.tsx` | Server | Cómo funciona Boogie |
| `/nosotros` | `page.tsx` | Server | Sobre nosotros |
| `/guia-anfitrion` | `page.tsx` | Server | Guía para anfitriones |

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
| `/admin/auditoria` | Log de auditoría |
| `/admin/configuracion` | Configuración global |

### API Routes

| Ruta | Método | Descripción |
|---|---|---|
| `/api/crypto/create` | POST | Crear dirección de depósito USDT (CryptAPI) |
| `/api/crypto/callback` | GET/POST | Webhook de confirmación de pago cripto |
| `/api/exchange-rate` | GET | Cotización EUR/VES (BCV) con rate limiting |
| `/api/metamap/webhook` | POST | Webhook de verificación de identidad (MetaMap) |
| `/api/payment-data` | GET | Datos de cuentas de pago de la plataforma |
| `/api/ubicaciones` | GET | Geocoding de ubicaciones venezolanas |

---

## Server Actions

Todas las operaciones de datos se realizan mediante Server Actions en `src/actions/`. Estos son los archivos principales y sus funciones exportadas:

### Autenticación

| Archivo | Funciones | Descripción |
|---|---|---|
| `auth.actions.ts` | `enviarOtpEmail`, `enviarOtpSms`, `verificarOtpYRegistrar`, `iniciarSesion`, `iniciarSesionAdmin`, `cerrarSesion`, `recuperarContrasena` | Flujo completo de auth con OTP |
| `auth-google.actions.ts` | `loginWithGoogle` | Inicio de OAuth con Google |
| `auth-perfil.actions.ts` | `completarPerfilGoogle` | Completar perfil tras Google OAuth |

### Perfil

| Archivo | Funciones |
|---|---|
| `perfil.actions.ts` | `getPerfilUsuario`, `actualizarPerfil`, `cambiarContrasena`, `subirAvatar` |

### Propiedades

| Archivo | Funciones | Descripción |
|---|---|---|
| `propiedad.actions.ts` | `crearPropiedad`, `actualizarPropiedad`, `eliminarPropiedad`, `actualizarEstadoPropiedad`, `getBoogieParaEditar`, `getMisPropiedades`, `getPropiedadesPublicas`, `getPropiedadPorId` | CRUD + búsqueda pública con filtros y geolocalización |

**Búsqueda pública** (`getPropiedadesPublicas`): Soporta filtros por ubicación, rango de precio, huéspedes, tipo, amenidades y proximidad geográfica (algoritmo Haversine, radio 25km).

### Reservas

| Archivo | Funciones |
|---|---|
| `reserva.actions.ts` | `crearReserva`, `cancelarReserva`, `confirmarORechazarReserva`, `getMisReservas`, `getReservasRecibidas`, `getReservaPorId`, `getReservaStoreItems` |

### Pagos

| Archivo | Funciones |
|---|---|
| `pago.actions.ts` | `registrarPago`, `verificarPago`, `getMisPagos` |
| `pago-reserva.actions.ts` | `registrarPagoReserva` (con comprobante en base64) |
| `metodo-pago.actions.ts` | `getMetodosPago`, `crearMetodoPago`, `eliminarMetodoPago` |
| `wallet.actions.ts` | `getTasaBCV`, `crearRecargaWallet`, `getWallet`, `activarWallet`, `getWalletTransacciones` |

### Reseñas, Store, Dashboard

| Archivo | Funciones |
|---|---|
| `review.actions.ts` | `crearResena`, `responderResena` |
| `boogie-store.actions.ts` | `getProductosStore`, `getServiciosStore` |
| `boogie-dashboard.actions.ts` | `getBoogieDashboard`, `crearGastoMantenimiento`, `eliminarGastoMantenimiento` |
| `secciones-destacadas.actions.ts` | `getSeccionesDestacadasPublicas`, `getSeccionesDestacadasAdmin`, `actualizarSeccionDestacada`, `eliminarSeccionDestacada`, `buscarPropiedadesAdmin`, `listarPropiedadesPublicadas` |
| `verificacion.actions.ts` | `getVerificacionUsuario`, `iniciarVerificacionMetaMap`, `subirDocumentoManual`, `getVerificacionesPendientes`, `revisarVerificacion`, `getUsuariosAdmin`, `actualizarRolUsuario`, `eliminarUsuarioAdmin`, `getAdminCounts` |

### Admin

| Archivo | Funciones |
|---|---|
| `admin-dashboard.actions.ts` | `getAdminStats`, `getAdminChartsData`, `getAdminTablesData` |
| `admin-propiedades.actions.ts` | `getPropiedadesAdmin`, `getPropiedadDetalleAdmin`, `actualizarPropiedadAdmin`, `eliminarPropiedadAdmin`, `getPropiedadIngresos`, `getCiudadesPropiedades` |
| `admin-reservas.actions.ts` | `getReservasAdmin`, `getReservaDetalleAdmin`, `accionReservaAdmin`, `getReservasStatsAdmin` |
| `admin-pagos.actions.ts` | `getPagosAdmin`, `getPagosStatsAdmin`, `verificarPagoAdmin` |
| `admin-resenas.actions.ts` | `getResenasAdmin`, `moderarResenaAdmin` |
| `admin-usuarios.actions.ts` | `registrarUsuarioAdmin` |
| `admin-auditoria.actions.ts` | `getAuditLogAdmin` |
| `admin-notificaciones.actions.ts` | `enviarNotificacionAdmin`, `getNotificacionesAdmin` |

---

## Componentes Principales

### Layout

| Componente | Archivo | Descripción |
|---|---|---|
| `Navbar` | `components/layout/navbar.tsx` | Barra de navegación con auth state y exchange rate |
| `Sidebar` | `components/layout/sidebar.tsx` | Sidebar del dashboard de usuario |
| `Footer` | `components/layout/footer.tsx` | Footer con links y redes sociales |

### Propiedades

| Componente | Archivo | Descripción |
|---|---|---|
| `PropertyCard` | `components/propiedades/property-card.tsx` | Card de propiedad en grid |
| `PropertyGrid` | `components/propiedades/property-grid.tsx` | Grid responsive de propiedades |
| `PropertyGallery` | `components/propiedades/property-gallery.tsx` | Galería de imágenes asimétrica |
| `PropertyLightbox` | `components/propiedades/property-lightbox.tsx` | Lightbox de pantalla completa |
| `PropertyFilters` | `components/propiedades/property-filters.tsx` | Filtros de búsqueda |
| `PropertyMap` | `components/propiedades/property-map.tsx` | Mapa con marcadores (MapLibre) |
| `BookingWidget` | `components/reservas/booking-widget.tsx` | Widget de reserva en sidebar |
| `BookingCalendar` | `components/reservas/booking-calendar.tsx` | Calendario de disponibilidad |
| `HostCard` | `components/propiedades/host-card.tsx` | Card del anfitrión con reputación |

### Pagos

| Componente | Archivo | Descripción |
|---|---|---|
| `PaymentMethodSelector` | `components/pagos/payment-method-selector.tsx` | Selector de método de pago |
| `PaymentForm` | `components/pagos/payment-form.tsx` | Formulario dinámico según método |
| `CryptoPayment` | `components/pagos/crypto-payment.tsx` | Pago USDT con QR y countdown |

### Landing

| Componente | Archivo |
|---|---|
| `HeroSection` | `components/landing/hero-section.tsx` |
| `ZonasSection` | `components/landing/zonas-section.tsx` |
| `StepsSection` | `components/landing/steps-section.tsx` |
| `PaymentsSection` | `components/landing/payments-section.tsx` |
| `CtaSection` | `components/landing/cta-section.tsx` |

### Boogie Store

| Componente | Archivo | Descripción |
|---|---|---|
| `BoogieStore` | `components/reservas/boogie-store.tsx` | Tienda de productos/servicios adicionales en el flujo de reserva |

### Shared

| Componente | Archivo | Descripción |
|---|---|---|
| `ConfirmationDialog` | `components/shared/confirmation-dialog.tsx` | Diálogo de confirmación genérico |
| `EmptyState` | `components/shared/empty-state.tsx` | Estado vacío con ícono y texto |
| `ErrorMessage` | `components/shared/error-message.tsx` | Mensaje de error estilizado |
| `RatingStars` | `components/shared/rating-stars.tsx` | Estrellas de calificación |
| `PriceDisplay` | `components/shared/price-display.tsx` | Precio con conversión de moneda |
| `ExchangeRateBadge` | `components/shared/exchange-rate-badge.tsx` | Badge con tasa BCV |

### Admin

| Componente | Archivo |
|---|---|
| `AdminSidebarDesktop` / `AdminSidebarMobile` | `components/admin/admin-sidebar.tsx` |
| `AdminHeader` | `components/admin/admin-header.tsx` |
| `AdminStatCard` | `components/admin/admin-stat-card.tsx` |
| `AdminFilterBar` | `components/admin/admin-filter-bar.tsx` |
| `AdminConfirmDialog` | `components/admin/admin-confirm-dialog.tsx` |

---

## Librerías y Utilidades (`src/lib/`)

### Supabase - Tres clientes distintos

| Archivo | Función | Uso |
|---|---|---|
| `supabase/client.ts` | `createClient()` | Componentes del navegador (browser) |
| `supabase/server.ts` | `createClient()` | Server Components y Server Actions (cookies) |
| `supabase/admin.ts` | `createAdminClient()` | Operaciones privilegiadas (bypassea RLS) |

> **Importante**: `createAdminClient()` usa la service role key. Nunca importar en componentes del cliente.

### Autenticación

| Archivo | Funciones | Descripción |
|---|---|---|
| `lib/auth.ts` | `getUsuarioAutenticado()`, `getUsuarioAutenticadoConSesion()` | Obtener usuario actual en Server Components/Actions |
| `lib/admin-auth.ts` | `requireAdmin()`, `logAdminAction()` | Verificar rol admin y registrar acciones en audit log |

### Validación

| Archivo | Descripción |
|---|---|
| `lib/validations.ts` | Esquemas Zod para auth, propiedades, reservas, pagos, reseñas, perfil. Infiere tipos como `RegistroInput`, `PropiedadInput`, etc. |
| `lib/admin-validations.ts` | Esquemas Zod para acciones de admin |

### Lógica de Reservas

| Archivo | Funciones | Descripción |
|---|---|---|
| `lib/reservas/calculos.ts` | `calcularPrecioReserva`, `calcularReembolsoCompleto` | Desglose de precios y reembolsos |
| `lib/reservas/disponibilidad.ts` | `verificarDisponibilidad` | Verifica solapamiento de reservas y fechas bloqueadas |
| `lib/reservas/estados.ts` | `puedeTransicionar`, `esEstadoFinal`, `sePuedeCancelar` | Máquina de estados de reservas |

### Otras Utilidades

| Archivo | Descripción |
|---|---|
| `lib/format.ts` | Formateo de precios (`formatPrecio`), fechas, teléfonos, cédulas, iniciales |
| `lib/constants.ts` | Comisiones (6% huésped, 3% anfitrión), planes, tipos de propiedad, estados venezolanos, métodos de pago, límites |
| `lib/cache.ts` | `unstable_cache` wrapper con tags y tiempos de invalidación |
| `lib/slug.ts` | Generación de slugs con sufijo aleatorio |
| `lib/rate-limit.ts` | Rate limiting en memoria para API routes |
| `lib/image-optimize.ts` | Compresión de imágenes cliente-side (WebP, max 1920x1440, ~400KB) |
| `lib/payment-data.ts` | Datos de cuentas bancarias de la plataforma (desde env vars) |
| `lib/store-constants.ts` | Tipos y categorías del Boogie Store |
| `lib/server-action.ts` | Tipos helper para respuestas de actions: `exito(datos)`, `error(mensaje)` |
| `lib/crypto/cryptapi.ts` | Integración con CryptAPI para pagos USDT TRC20 |
| `lib/services/exchange-rate.ts` | Cotización EUR/VES con fallbacks |

### Custom Hooks

| Hook | Descripción |
|---|---|
| `useDebounce(valor, delay)` | Debounce genérico |
| `useMediaQuery(query)` | Detección de media queries |
| `useIsMobile()` | `max-width: 767px` |
| `useIsTablet()` | `768px - 1023px` |
| `useIsDesktop()` | `min-width: 1024px` |
| `useSearch()` | Estado de búsqueda con debounce |

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

### Migraciones de Supabase

Las migraciones SQL están en `supabase/migrations/`:

| # | Archivo | Descripción |
|---|---|---|
| 001 | `001_verificaciones_documento.sql` | Tabla de verificación de identidad |
| 002 | `002_gastos_mantenimiento.sql` | Gastos de mantenimiento |
| 003 | `003_wallets.sql` | Wallets y transacciones |
| 004 | `004_admin_audit_log.sql` | Log de auditoría |
| 005 | `005_cascade_delete_usuarios.sql` | Cascade delete |
| 006 | `006_rename_huesped_to_booger.sql` | Renombrado de rol |
| 007 | `007_add_resena_oculta.sql` | Flag de reseña oculta |
| 008 | `008_plan_suscripcion.sql` | Plan de suscripción |
| 009 | `009_secciones_destacadas.sql` | Secciones destacadas |
| 010 | `010_boogie_store.sql` | Store (productos y servicios) |
| 011 | `011_imagenes_categoria.sql` | Categoría en imágenes |
| 012 | `012_reputacion_anfitrion.sql` | Reputación de anfitrión |
| 013 | `013_crypto_payments.sql` | Campos de pago cripto |
| 014 | `014_performance_indexes.sql` | Índices de performance |

---

## Flujos Principales

### Autenticación

1. **Email/Password**: Registro con OTP (email o SMS) -> Verificación -> Perfil completo
2. **Google OAuth**: Login con Google -> Si no tiene perfil, redirige a `/completar-perfil`
3. **Middleware** (`src/middleware.ts`): Protege rutas, fuerza completar perfil, verifica rol admin

### Reserva (4 pasos)

1. **Resumen**: Muestra propiedad, fechas, noches, desglose de precios
2. **Boogie Store**: Productos/servicios adicionales (opcional)
3. **Pago**: Selección de método + formulario de pago (7 métodos + cripto)
4. **Confirmación**: Reserva creada, pago en verificación

La reserva se crea al confirmar el pago (`crearReserva`), y se asocia el comprobante de pago con `registrarPagoReserva`.

### Pagos

Los pagos son verificados manualmente por el anfitrión (o admin). El flujo:

1. Huésped envía comprobante (referencia, banco, foto)
2. Estado inicial: `PENDIENTE`
3. Anfitrión verifica -> `VERIFICADO`
4. Se confirma la reserva automáticamente si estaba `PENDIENTE`

**Cripto (USDT TRC20)**: Flujo automático vía CryptAPI. Se genera una dirección de depósito y el webhook `/api/crypto/callback` confirma el pago en blockchain.

### Caché

Se usa `unstable_cache` de Next.js con tags para invalidación selectiva:

- `CACHE_TAGS.PROPIEDADES` -> Invalida todas las propiedades
- `CACHE_TAGS.PROPIEDAD(id)` -> Invalida una propiedad específica
- Tiempos: listado 60s, detalle 300s, zonas 3600s

La función `invalidatePropiedadCache(propiedadId)` se llama al crear/editar/eliminar propiedades.

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

**Convención de colores**: Se usan directamente como valores Tailwind (ej: `text-[#1B4332]`, `bg-[#FEFCF9]`). No hay design tokens en config.

---

## Convenciones del Proyecto

### Server vs Client Components

- Las páginas que solo leen datos son **Server Components** (la mayoría)
- Se marca `'use client'` cuando hay interactividad (useState, useEffect, onClick, etc.)
- Las Server Actions (`'use server'`) viven en `src/actions/`

### Estructura de una Server Action

```typescript
// src/actions/ejemplo.actions.ts
'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function miAccion(datos: MiInput) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: { mensaje: 'No autenticado' } }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('tabla').insert(datos)

  if (error) return { error: { mensaje: error.message } }
  return { exito: true, datos: data }
}
```

### Nombres en la Base de Datos

Supabase usa **snake_case** (ej: `precio_por_noche`, `estado_publicacion`). Los tipos TypeScript mapean a **camelCase** (ej: `precioPorNoche`, `estadoPublicacion`). La conversión se hace manualmente en cada action.

### Tipos

- Tipos globales: `src/types/index.ts` (enums, `Rol`, `Moneda`, `MetodoPagoEnum`, etc.)
- Tipos de reserva: `src/types/reserva.ts` (`ResultadoAccion`, `ReservaConPropiedad`, labels, colores)
- Tipos generados: `src/generated/prisma/models/` (auto-generados por Prisma)

### Testing

Los tests están en `src/__tests__/` usando Vitest:

```
src/__tests__/
├── actions/          # Tests de server actions
├── auth/             # Tests de auth y middleware
├── lib/reservas/     # Tests de lógica de reservas
├── validations/      # Tests de schemas Zod
├── format.test.ts
└── server-action.test.ts
```

---

## Deployment

El proyecto está desplegado en **Vercel** y configurado para deployment automático desde la rama `master`.

```bash
# Deploy manual
npm install -g vercel
vercel
```

El build script (`npm run build`) genera los tipos de Prisma antes de compilar Next.js.

---

## Licencia

Privado - Todos los derechos reservados.
