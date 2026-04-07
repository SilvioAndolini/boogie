# Datos Scapeados y Seed Data - Boogie

## Estado del Scraping: ✅ COMPLETADO

**Fecha de scraping:** 6-7 de Abril de 2026  
**Sitio scrapado:** estei.app  
**Propiedades extraídas:** 36 (3 ubicaciones)

---

## Archivos Generados

### Scraper - estei.app
El scraper (`scripts/scraper-estei.ts`) usa Playwright para extraer propiedades del sitio estei.app.

**URLs de propiedades encontradas:** `/stay/{id}/profile`

### Datos Extraídos

```
infoScrapeada/
├── inmuebles_estei.json          # 36 propiedades combinadas
├── inmueble_estei_*.json         # 36 archivos individuales
├── plantilla_inmueble.json        # Template de referencia
├── inmuebles_seed.json           # 8 propiedades de ejemplo originales
└── README.md                    # Este archivo
```

### Resumen de Propiedades Scraped

| Ubicación | Cantidad |
|-----------|----------|
| Caracas | 12 |
| Margarita | 12 |
| La Guaira | 12 |
| **Total** | **36** |

### Muestra de Propiedades

1. **Novo Hotel** - $75 USD - 5 habitaciones
2. **Apartamento 50 Mts 3 Personas** - $100 USD - 1 habitación
3. **Super Estadía Caracas 2 Hab Pet Friendly Padel** - $100 USD - 2 habitaciones
4. **Anexo Remodelado en la California Norte** - $60 USD
5. **Excelente Apartamento con Todas las Comodidades** - $70 USD
6. **Bello Apartamento con Estacionamiento Gratuito** - $85 USD
7. **Casa Vacacional con Piscina en La Guaira** - $150 USD - 4 habitaciones
8. **Moderno Apartamento en El Rosal** - $90 USD
9. **Oceanview** - $120 USD - 3 habitaciones

---

## Uso del Scraper

### Prerrequisitos
```bash
npm install -D playwright @playwright/test
npx playwright install chromium
```

### Ejecutar Scraper
```bash
npx tsx scripts/scraper-estei.ts
```

El scraper:
1. Navega a las páginas de búsqueda de estei.app
2. Extrae tarjetas de propiedades con títulos, precios, ubicación
3. Guarda cada propiedad en archivos JSON individuales
4. Genera un archivo combinado `inmuebles_estei.json`

---

## Importar a la Base de Datos

### Prerrequisitos
```bash
# Generar cliente Prisma
npx prisma generate

# Asegurarse de tener un usuario admin
```

### Importar
```bash
# Importar todos los inmuebles de estei
npx tsx scripts/importar-inmuebles.ts --path=infoScrapeada

# Ver ayuda
npx tsx scripts/importar-inmuebles.ts --help
```

---

## Estructura de Datos

```json
{
  "id": "estei_1775520241432_0",
  "titulo": "Novo Hotel",
  "descripcion": "Propiedad scrapeada de estei.app",
  "tipoPropiedad": "HABITACION",
  "precioPorNoche": 75,
  "moneda": "USD",
  "capacidadMaxima": 2,
  "habitaciones": 5,
  "banos": 1,
  "camas": 1,
  "direccion": "",
  "ciudad": "Venezuela",
  "estado": "Distrito Capital",
  "zona": null,
  "latitud": null,
  "longitud": null,
  "reglas": null,
  "politicaCancelacion": "MODERADA",
  "horarioCheckIn": "15:00",
  "horarioCheckOut": "11:00",
  "estanciaMinima": 1,
  "estanciaMaxima": 30,
  "estadoPublicacion": "PUBLICADA",
  "imagenes": [
    {
      "url": "https://ik.imagekit.io/...",
      "alt": "novo-hotel-0",
      "orden": 1,
      "esPrincipal": true
    }
  ],
  "amenidades": ["wifi", "aire_acondicionado"],
  "fuenteScraping": {
    "sitio": "estei.app",
    "urlOriginal": "https://estei.app/stay/...",
    "fechaScraping": "2026-04-07T00:04:01.432Z"
  }
}
```

---

## Notas sobre la Calidad de Datos

### Campos Extraídos Exitosamente
- ✅ Título (del alt de imagen)
- ✅ Precio por noche
- ✅ Moneda (USD)
- ✅ Tipo de propiedad (inferido del texto)
- ✅ Número de habitaciones
- ✅ Número de baños
- ✅ URL de imágenes (varias por propiedad)

### Campos Pendientes de Completar
- ⏳ Descripción completa (requiere entrar a cada propiedad)
- ⏳ Dirección exacta
- ⏳ Ciudad y estado (a veces default)
- ⏳ Coordenadas GPS
- ⏳ Amenidades específicas
- ⏳ Reglas de la propiedad
- ⏳ Todas las imágenes (solo se extrae 1 por limitantes del sitio)

### Limitaciones del Sitio Fuente
1. El contenido de las páginas de detalle carga dinámicamente
2. Se requiere JavaScript para renderizar completo
3. Las imágenes del mapa de Google se filtran manualmente

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `scraper-estei.ts` | Extrae propiedades de estei.app |
| `importar-inmuebles.ts` | Importa JSON a la base de datos |

---

## Próximos Pasos

1. **Enriquecer datos**: Visitar cada URL de propiedad para obtener descripción completa
2. **Geocoding**: Usar las direcciones para obtener lat/lng
3. **Validar imágenes**: Verificar que las URLs de imágenes aún funcionan
4. **Importar a BD**: Correr el script de importación

---

## Términos y Condiciones

⚠️ **Nota importante:** Los datos scrapeados son solo para uso de desarrollo y testing.

- Las imágenes son hosted en servicios de terceros (ImageKit, DigitalOcean Spaces)
- Los precios y disponibilidad pueden no estar actualizados
- Se recomienda verificar los datos antes de uso en producción
