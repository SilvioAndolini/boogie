# Instrucciones para subir Boogie a GitHub

## Opción 1: Usando GitHub CLI (recomendado)

1. Instalar GitHub CLI (si no está instalado):
```bash
sudo apt install gh
```

2. Autenticarse en GitHub:
```bash
gh auth login
```

3. Crear repositorio y subir código:
```bash
cd /mnt/c/Users/swmfi/Documents/Proyectos/swmTech/boogie
gh repo create boogie --public --source=. --remote=origin --push
```

## Opción 2: Usando token de acceso personal (PAT)

1. Crear un token en GitHub:
   - Ve a https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Selecciona permisos: `repo`, `workflow`
   - Copia el token

2. Configurar git con el token:
```bash
cd /mnt/c/Users/swmfi/Documents/Proyectos/swmTech/boogie
git remote add origin https://TU_USUARIO:TOKEN@github.com/TU_USUARIO/boogie.git
git push -u origin master
```

## Opción 3: Manual (desde GitHub.com)

1. Crear repositorio en GitHub:
   - Ve a https://github.com/new
   - Nombre: `boogie`
   - Descripción: "Plataforma de alquileres vacacionales en Venezuela"
   - Público
   - NO inicializar con README, .gitignore o licencia

2. Subir código:
```bash
cd /mnt/c/Users/swmfi/Documents/Proyectos/swmTech/boogie
git remote add origin https://github.com/TU_USUARIO/boogie.git
git push -u origin master
```

## Información del proyecto

- **Nombre**: Boogie
- **Descripción**: Plataforma de alquileres vacacionales en Venezuela
- **Stack**: Next.js 16, Prisma 7, Supabase, TypeScript, Tailwind CSS
- **Características**: 
  - Sistema de reservas con calendario
  - Pagos locales (Pago Móvil, Zelle, USDT)
  - Panel de usuario
  - Sistema de reseñas
  - Landing page con búsqueda

## Archivos importantes

- `README.md`: Documentación principal
- `prisma/schema.prisma`: Esquema de base de datos
- `src/app/`: Páginas de la aplicación
- `src/components/`: Componentes de UI
- `documentacion/`: Documentación técnica generada

## Notas

- El repositorio ya tiene commits preparados
- Configuración de git local: SWM Films (swmfi@swm.local)
- Cambiar a tu información personal después de subir