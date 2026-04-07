# Changelog — Boogie

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
