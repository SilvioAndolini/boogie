# WORKPLAN — Boogie Parallel Development

> **Single source of truth para multiples agentes trabajando en paralelo.**
> Cada agente lee este archivo ANTES de empezar. Respeta tu lane. No toques archivos de otro lane.

---

## Reglas Generales

1. **Un archivo = un solo agente a la vez.** Si necesitas editar un archivo de otro lane, espera a que ese lane mergee.
2. **Cada lane trabaja en su propio branch.** Branch naming: `lane/<lane-id>/<descripcion>`.
3. **Commitea frecuentemente** — cada sub-tarea completada es un commit.
4. **No edites estos archivos sin coordinacion:** `AGENTS.md`, `package.json`, `go.mod`, `go.sum`, `prisma/schema.prisma`, `WORKPLAN.md`.
5. **Antes de empezar**, haz `git pull origin master` y `git checkout -b lane/<lane-id>/<desc>` desde master.
6. **Al terminar un lane**, crea PR a master. Los lanes dependientes hacen rebase despues del merge.
7. **Orden de merge:** Lane 0 → Lane 1/4 → Lane 2/3/5 (ver grafo de dependencias).

---

## Grafo de Dependencias

```
Lane 0 (Shared: DB/Types/Constants)
  ├── Lane 1 (Backend Go)
  ├── Lane 4 (Frontend Lib/Actions)
  │     ├── Lane 2 (Frontend Components)
  │     └── Lane 5 (Frontend Pages/Routes)
  └── Lane 3 (Frontend Components) [puede correr con Lane 2]
```

**Lane 0 mergea PRIMERO.** Los demas hacen rebase antes de continuar.

---

## Lane 0 — Shared Foundation (MERGE PRIMERO)

**Branch:** `lane/0-shared/<desc>`
**Dominio de archivos:** Solo los compartidos.

| Archivo | Responsabilidad |
|---------|----------------|
| `prisma/schema.prisma` | Enums, modelos, columnas nuevas |
| `prisma/seed.ts` | Datos seed (amenidades, etc.) |
| `src/types/index.ts` | Tipos TypeScript compartidos |
| `src/lib/constants.ts` | Constantes compartidas |
| `src/lib/validations.ts` | Schemas Zod compartidos |

**Regla:** Este lane mergea antes que todos. Los demas lanes dependen de estos archivos.

---

## Lane 1 — Backend Go

**Branch:** `lane/1-backend/<desc>`
**Dominio de archivos:** `backend/**` (excepto `go.mod`/`go.sum` que requieren coordinacion)

### Sub-lanes (pueden correr en paralelo DENTRO del lane)

| Sub-lane | Capa | Archivos permitidos |
|----------|------|-------------------|
| 1A | Domain | `backend/internal/domain/**/*.go` |
| 1B | Repository | `backend/internal/repository/*.go` |
| 1C | Service | `backend/internal/service/*.go` |
| 1D | Handler + Router | `backend/internal/handler/*.go`, `backend/internal/router/*.go` |
| 1E | Config + Main | `backend/internal/config/*.go`, `backend/cmd/**/*.go` |

**Regla interna Lane 1:** Si 1A agrega campos nuevos, 1A commitea primero y los demas hacen rebase.

### Tests de este lane
- `cd backend && go build ./...` — debe compilar limpio
- `cd backend && go vet ./...` — sin warnings nuevos

---

## Lane 2 — Frontend Pages & Routes

**Branch:** `lane/2-pages/<desc>`
**Dominio de archivos:** `src/app/**`

| Directorio | Contenido |
|------------|-----------|
| `src/app/(main)/**` | Paginas publicas (propiedades, canchas, etc.) |
| `src/app/(panel)/**` | Dashboard del usuario |
| `src/app/(admin)/**` | Panel admin |
| `src/app/api/**` | API routes (si existen) |
| `src/middleware.ts` | Middleware de rutas |

**Depende de:** Lane 0 (types), Lane 4 (actions), Lane 3 (components)
**Regla:** NO crear componentes nuevos — usar los de Lane 3. Si necesitas un componente que no existe, documentalo en WORKPLAN y Lane 3 lo crea.

---

## Lane 3 — Frontend Components

**Branch:** `lane/3-components/<desc>`
**Dominio de archivos:** `src/components/**`

| Directorio | Contenido |
|------------|-----------|
| `src/components/canchas/**` | Componentes de canchas |
| `src/components/propiedades/**` | Componentes de propiedades |
| `src/components/busqueda/**` | Busqueda y filtros |
| `src/components/landing/**` | Landing page |
| `src/components/layout/**` | Navbar, sidebar, footer |
| `src/components/ui/**` | Componentes UI base (shadcn) |
| `src/components/admin/**` | Componentes admin |

**Depende de:** Lane 0 (types, constants)
**Regla:** NO importar desde `src/app/**` ni `src/actions/**`. Solo de `src/lib/**`, `src/types/**`, `src/components/**`.

---

## Lane 4 — Frontend Lib & Actions

**Branch:** `lane/4-lib/<desc>`
**Dominio de archivos:** `src/lib/**`, `src/actions/**`

| Directorio | Contenido |
|------------|-----------|
| `src/actions/*.ts` | Server actions |
| `src/lib/go-api-client.ts` | Cliente API Go |
| `src/lib/supabase/**` | Clientes Supabase |
| `src/lib/constants.ts` | Compartido (Lane 0) |
| `src/lib/validations.ts` | Compartido (Lane 0) |
| `src/lib/image-optimize.ts` | Optimizacion de imagenes |

**Depende de:** Lane 0 (types)
**Regla:** NO importar desde `src/components/**` ni `src/app/**`.

---

## Lane 5 — Frontend Config & Static

**Branch:** `lane/5-config/<desc>`
**Dominio de archivos:** Config raiz y estaticos

| Archivo | Contenido |
|---------|-----------|
| `package.json` | Dependencias (coordinacion requerida) |
| `tailwind.config.*` | Config Tailwind |
| `next.config.*` | Config Next.js |
| `public/**` | Assets estaticos |

---

## Tareas Pendientes

> **Formato:** `[ ]` = pendiente, `[x]` = resuelto. Cada tarea indica su lane.

### Fase 1 — Foundation Sports/Express
- [x] 1.1 Migracion DB (enums, columnas, amenidades deportivas)
- [x] 1.2 Backend Go (filtros, handlers, disponibilidad)
- [x] 1.3 Frontend types/constants/validations
- [x] 1.4 Frontend busqueda/navegacion
- [x] 1.5 Frontend paginas + componentes canchas
- [ ] **1.6 Punto 6 de fase 1** — Pendiente definicion (ver Notion)
- [x] 1.7 Fix crear/editar propiedad (Supabase directo)
- [x] 1.8 Auditoria backend — bugs corregidos

### Fase 2 — Pendiente definicion (ver Notion)
### Fase 3 — Pendiente definicion (ver Notion)
### Fase 4 — Pendiente definicion (ver Notion)
### Fase 5 — Pendiente definicion (ver Notion)
### Fase 6 — Pendiente definicion (ver Notion)
### Fase 7 — Pendiente definicion (ver Notion)
### Fase 8 — Pendiente definicion (ver Notion)
### Fase 9 — Pendiente definicion (ver Notion)

---

## Estado de Branches

| Lane | Branch | Estado | Archivos modificados |
|------|--------|--------|---------------------|
| — | master | Todo en working tree, sin commit | ~50 archivos |

**Proximo paso:** Commit de todo lo avanzado a master, luego crear branches por lane.

---

## Protocolo de Merge

1. Lane 0 mergea a master via PR
2. Todos los demas lanes: `git fetch origin && git rebase origin/master`
3. Resolver conflictos si los hay (prioridad: master > lane)
4. Lane 1 mergea (backend no depende de frontend)
5. Lane 4 mergea (actions/lib)
6. Lanes 3 y 2 mergean en cualquier orden
7. Lane 5 mergea ultimo (config)

## Deploy

- **Frontend:** Push a master = auto-deploy Vercel
- **Backend:** Despues de merge de Lane 1, deploy manual a Linode (ver AGENTS.md)
- **DB:** Solo despues de merge de Lane 0, aplicar migracion en Supabase

---

## Conflict Resolution

Si dos lanes necesitan el mismo archivo:
1. El lane con **menor numero** tiene prioridad
2. El lane con mayor numero espera al merge y hace rebase
3. Si es un archivo compartido (Lane 0), el cambio se hace ahi y se propaga
