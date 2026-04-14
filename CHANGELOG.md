# Changelog — Boogie

## [2026-04-13] Migración a Backend Go

### Arquitectura Dual

El proyecto ahora tiene dos componentes separados:

| Componente | Stack | Puerto |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | 3000 |
| **Backend** | Go + Chi v5 | 8080 |

El frontend Next.js funciona como aplicación web full-stack, delegando lógica de negocio pesada al backend Go via HTTP.

### Backend Go (carpeta `/backend`)

**Stack técnico:**
- Go 1.24+ con Chi v5 router
- pgx/v5 para PostgreSQL
- JWT con JWKS para autenticación Supabase
- Rate limiting por IP

**Estructura de capas:**
```
handler/ → HTTP (receiven request, retornan JSON)
    ↓
service/ → Lógica de negocio
    ↓
repository/ → Acceso a datos (SQL con pgx)
```

**Endpoints principales:**
- `/api/v1/auth/*` — Login, OTP, registro, Google OAuth
- `/api/v1/reservas/*` — CRUD reservas
- `/api/v1/pagos/*` — Pagos con comprobante
- `/api/v1/wallet/*` — Boogie Wallet
- `/api/v1/admin/*` — Panel de administración (requiere rol ADMIN)
- `/api/v1/exchange-rate` — Tipo de cambio EUR/VES
- `/api/v1/crypto/create` — Crear dirección USDT (CryptAPI)
- `/api/v1/crypto/callback` — Webhook CryptAPI
- `/api/v1/metamap/webhook` — Webhook verificación MetaMap

**Servicios implementados:**
- `propiedades_service.go` — Búsqueda con filtros y geolocalización
- `reserva_service.go` — Creación, confirmación, cancelación
- `pago_service.go` — Registro y verificación de pagos
- `crypto_service.go` — Integración CryptAPI USDT TRC20
- `exchange_service.go` — Cotización BCV con fallbacks
- `admin_service.go` — Dashboard, estadísticas, CRUD admin
- `wallet_service.go` — Recargas y transacciones

### Archivos nuevos (Backend)

```
backend/
├── cmd/server/main.go
├── internal/
│   ├── auth/supabase.go, supabase_auth_client.go
│   ├── config/config.go
│   ├── domain/models/models.go, enums/enums.go
│   ├── handler/{auth,reserva,pago,crypto,admin,etc}_handler.go
│   ├── handler/middleware.go, response.go
│   ├── repository/{auth,reserva,pago,propiedades,admin}_repository.go
│   ├── router/router.go
│   └── service/{reserva,pago,crypto,exchange,admin}_service.go
└── go.mod
```

### Cambios en Frontend

- Server Actions ahora hacen llamadas HTTP al backend Go en lugar de query directly a Supabase (para operaciones protegidas)
- API Routes públicas (`/api/exchange-rate`, `/api/ubicaciones`) se mantienen en Next.js
- Webhooks de terceros (`/api/crypto/callback`, `/api/metamap/webhook`) delegados al backend Go

### Configuración

**Backend** (`.env` o vars de entorno):
```bash
PORT=8080
APP_URL=http://localhost:3000
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SECRET_KEY=[service_role_key]
DATABASE_URL=postgres://...
CRYPTAPI_WALLET_ADDRESS=[wallet]
CRYPTAPI_CALLBACK_SECRET=[secret]
METAMAP_WEBHOOK_SECRET=[secret]
```

---

## [2026-04-07] Panel de gestión de boogies + optimización de imágenes

### Creación de boogies (refactor completo)
- **3 pasos en vez de 4**: Información básica, Ubicación, Detalles finales
- Las amenidades, reglas, políticas y subida de imágenes se fusionaron en "Detalles finales"
- El botón final dice "Crear Boogie" en lugar de "Siguiente"
- **Fix crítico**: La creación ya no se dispara automáticamente al avanzar pasos. Se eliminó `<form>` y `handleSubmit`, usando `onClick` manual + `getValues()`/`trigger()` de react-hook-form
- Textos refactorizados de "propiedad/propiedades" a "boogie/boogies"

### Panel de edición de boogies
- Nueva ruta: `/dashboard/mis-propiedades/[id]/editar`
- Server component carga datos existentes via `getBoogieParaEditar()`
- Cliente precarga todos los campos, amenidades e imágenes existentes
- Permite agregar nuevas imágenes con optimización automática

### Sistema de slugs para URLs amigables
- Nuevo formato: `/propiedades/apartamento-moderno-en-chacao-7x9k2m`
- Slug = título normalizado (sin acentos, lowercase) + 6 chars aleatorios
- `getPropiedadPorId()` ahora busca por slug o UUID (backward compatible)
- Creado `src/lib/slug.ts` con utilidad `generarSlug()`

### Menú contextual en tarjetas de boogies
- Dropdown con 3 puntos: Editar boogie, Pausar boogie, Eliminar boogie
- **Pausar**: Cambia estado entre PAUSADA y BORRADOR
- **Eliminar**: Dialog de confirmación que requiere escribir "Eliminar boogie" exactamente
- Eliminación completa: borra imágenes del Storage, amenidades y registro de la BD

### Optimización de imágenes
- Nuevo `src/lib/image-optimize.ts`: redimensiona a max 1920x1440, convierte a WebP
- Compresión iterativa (92% → 60%) con objetivo de ~400KB por imagen
- UI muestra spinner "Optimizando imágenes..." durante el proceso
- Server actions: forzado de `contentType: 'image/webp'`, generación de `id` con `crypto.randomUUID()`
- `next.config.ts`: body size limit aumentado a 10MB para server actions

### Tarjetas del dashboard (UI)
- Imagen con bordes completamente redondeados (`rounded-xl`)
- Padding lateral mejorado (`mx-3 mt-3` en imagen, `px-5 pb-5` en contenido)
- Click en tarjeta navega a `/propiedades/{slug}` (página de detalle pública)
- Dropdown menú con `stopPropagation` para no activar navegación

### Server actions nuevos
- `eliminarPropiedad()`: elimina storage + amenidades + propiedad
- `getBoogieParaEditar()`: obtiene propiedad con amenidades e imágenes
- `actualizarPropiedad()`: actualiza datos, amenidades y nuevas imágenes
- `actualizarEstadoPropiedad()`: ya existía, ahora conectado al UI

### Configuración
- `SUPABASE_SECRET_KEY` agregada a `.env.local` para admin client
- Bucket `imagenes` creado en Supabase Storage (public)
- Columna `slug` agregada a tabla `propiedades` con unique index

### Archivos nuevos
- `src/lib/slug.ts`
- `src/lib/image-optimize.ts`
- `src/app/(panel)/dashboard/mis-propiedades/boogie-card.tsx`
- `src/app/(panel)/dashboard/mis-propiedades/[id]/editar/page.tsx`
- `src/app/(panel)/dashboard/mis-propiedades/[id]/editar/editar-boogie-client.tsx`

### Archivos modificados
- `next.config.ts` — body size limit 10MB
- `src/actions/propiedad.actions.ts` — slugs, CRUD completo, image upload
- `src/app/(panel)/dashboard/mis-propiedades/page.tsx` — server component con BoogieCard
- `src/app/(panel)/dashboard/mis-propiedades/nueva/page.tsx` — 3 pasos, sin form, imágenes
