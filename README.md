# Boogie

**Plataforma de alquileres vacacionales en Venezuela**

Tu hogar lejos de casa. Boogie conecta anfitriones y huéspedes en toda Venezuela con procesamiento de pagos local (Pago Móvil, Zelle, transferencia bancaria, USDT y más).

## Stack Tecnológico

| Tecnología | Propósito |
|---|---|
| Next.js 16 (App Router) | Framework fullstack con SSR/SSG |
| TypeScript | Tipado estático |
| Tailwind CSS 4 | Estilos utilitarios |
| shadcn/ui (Base UI) | Componentes accesibles |
| Prisma 7 | ORM con PostgreSQL (Supabase) |
| Supabase Auth | Autenticación |
| Supabase Storage | Imágenes de propiedades |
| Zod | Validación de esquemas |
| React Hook Form | Manejo de formularios |
| Zustand | Estado global del cliente |
| TanStack Query | Cache del servidor |
| Framer Motion | Animaciones |

## Funcionalidades

- **Autenticación**: Registro, login, recuperación de contraseña, verificación de email
- **Propiedades**: CRUD completo, formulario multi-paso, filtros de búsqueda
- **Reservas**: Widget de reserva, calendario de disponibilidad, cálculo de precios
- **Pagos**: 7 métodos de pago locales (Pago Móvil, Zelle, transferencia, USDT, etc.)
- **Reseñas**: Sistema de calificaciones con múltiples categorías
- **Panel de usuario**: Dashboard con métricas, gestión de propiedades y reservas
- **Landing page**: Hero, zonas populares, propiedades destacadas, CTA
- **Zonas**: Exploración por estados de Venezuela (24 estados)

## Configuración

### Prerrequisitos

- Node.js 20+
- npm 10+
- Cuenta en Supabase (gratis)

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Generar cliente Prisma
npm run postinstall

# Crear migración inicial (requiere DATABASE_URL configurado)
npm run db:migrate

# Seed de amenidades básicas
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

Ver `.env.example` para la lista completa. Las esenciales son:

- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Key pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Key de servicio (solo backend)
- `DATABASE_URL` - URL de conexión PostgreSQL

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run format       # Formateo con Prettier
npm run db:migrate   # Crear migración
npm run db:push      # Push schema sin migración
npm run db:seed      # Ejecutar seed
npm run db:studio    # Prisma Studio (visualizador de BD)
```

## Paleta de Colores

| Color | Hex | Uso |
|---|---|---|
| Primario | `#1B4332` | Botones principales, accents |
| Accent | `#E76F51` | CTAs, elementos destacados |
| Fondo | `#FEFCF9` | Fondo general |
| Superficie | `#FFFFFF` | Cards, modales |
| Borde | `#E8E4DF` | Bordes, separadores |
| Texto | `#1A1A1A` | Texto principal |

## Deployment

El proyecto está configurado para deployment en Vercel:

```bash
npm install -g vercel
vercel
```

## Licencia

Privado - Todos los derechos reservados.
