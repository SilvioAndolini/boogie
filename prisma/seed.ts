// Seed de la base de datos con amenidades básicas
import { PrismaClient, CategoriaAmenidad } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Amenidades agrupadas por categoría
  const amenidades = [
    // Esenciales
    { nombre: 'Wi-Fi', icono: 'wifi', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Aire acondicionado', icono: 'wind', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Agua caliente', icono: 'droplets', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Toallas', icono: 'bath', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Sábanas y cobijas', icono: 'bed', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Jabón y shampoo', icono: 'soap', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Papel higiénico', icono: 'scroll', categoria: CategoriaAmenidad.ESENCIALES },
    { nombre: 'Estacionamiento', icono: 'car', categoria: CategoriaAmenidad.ESENCIALES },

    // Cocina
    { nombre: 'Cocina completa', icono: 'cooking-pot', categoria: CategoriaAmenidad.COCINA },
    { nombre: 'Refrigerador', icono: 'refrigerator', categoria: CategoriaAmenidad.COCINA },
    { nombre: 'Microondas', icono: 'microwave', categoria: CategoriaAmenidad.COCINA },
    { nombre: 'Cafetera', icono: 'coffee', categoria: CategoriaAmenidad.COCINA },
    { nombre: 'Utensilios de cocina', icono: 'utensils', categoria: CategoriaAmenidad.COCINA },
    { nombre: 'Plancha', icono: 'flame', categoria: CategoriaAmenidad.COCINA },

    // Baño
    { nombre: 'Secador de pelo', icono: 'wind', categoria: CategoriaAmenidad.BANO },
    { nombre: 'Baño privado', icono: 'bath', categoria: CategoriaAmenidad.BANO },

    // Comodidades
    { nombre: 'TV', icono: 'tv', categoria: CategoriaAmenidad.COMODIDADES },
    { nombre: 'Lavadora', icono: 'washing-machine', categoria: CategoriaAmenidad.COMODIDADES },
    { nombre: 'Plancha de ropa', icono: 'shirt', categoria: CategoriaAmenidad.COMODIDADES },
    { nombre: 'Escritorio de trabajo', icono: 'laptop', categoria: CategoriaAmenidad.COMODIDADES },
    { nombre: 'Ventilador', icono: 'fan', categoria: CategoriaAmenidad.COMODIDADES },

    // Entretenimiento
    { nombre: 'Piscina', icono: 'waves', categoria: CategoriaAmenidad.ENTRETENIMIENTO },
    { nombre: 'Parrilla', icono: 'flame', categoria: CategoriaAmenidad.ENTRETENIMIENTO },
    { nombre: 'Mesa de billar', icono: 'circle', categoria: CategoriaAmenidad.ENTRETENIMIENTO },

    // Exterior
    { nombre: 'Terraza/Balcón', icono: 'sun', categoria: CategoriaAmenidad.EXTERIOR },
    { nombre: 'Jardín', icono: 'trees', categoria: CategoriaAmenidad.EXTERIOR },
    { nombre: 'Área de BBQ', icono: 'flame', categoria: CategoriaAmenidad.EXTERIOR },
    { nombre: 'Vista al mar', icono: 'mountain-snow', categoria: CategoriaAmenidad.EXTERIOR },

    // Seguridad
    { nombre: 'Cámaras de seguridad', icono: 'camera', categoria: CategoriaAmenidad.SEGURIDAD },
    { nombre: 'Caja fuerte', icono: 'lock', categoria: CategoriaAmenidad.SEGURIDAD },
    { nombre: 'Detector de humo', icono: 'flame', categoria: CategoriaAmenidad.SEGURIDAD },
    { nombre: 'Extintor', icono: 'shield', categoria: CategoriaAmenidad.SEGURIDAD },

    // Servicios
    { nombre: 'Check-in self service', icono: 'key', categoria: CategoriaAmenidad.SERVICIOS },
    { nombre: 'Se permiten mascotas', icono: 'paw-print', categoria: CategoriaAmenidad.SERVICIOS },
    { nombre: 'Adecuado para familias', icono: 'baby', categoria: CategoriaAmenidad.SERVICIOS },
    { nombre: 'Adecuado para eventos', icono: 'party-popper', categoria: CategoriaAmenidad.SERVICIOS },

    // Deporte
    { nombre: 'Iluminación nocturna', icono: 'sun', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Vestuarios', icono: 'shirt', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Duchas', icono: 'droplets', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Estacionamiento', icono: 'car', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Graderías', icono: 'users', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Marcador electrónico', icono: 'monitor', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Césped sintético', icono: 'grid-3x3', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Piso de madera', icono: 'square', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Piso de cemento', icono: 'square', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Redes', icono: 'grip', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Canasta de basketball', icono: 'target', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Red de tenis', icono: 'grip', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Mesa de ping-pong', icono: 'table', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Bebedero', icono: 'droplets', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Área de calentamiento', icono: 'flame', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Tienda deportiva', icono: 'shopping-bag', categoria: CategoriaAmenidad.DEPORTE },
    { nombre: 'Alquiler de equipos', icono: 'package', categoria: CategoriaAmenidad.DEPORTE },
  ]

  // Crear amenidades (upsert para evitar duplicados)
  for (const amenidad of amenidades) {
    await prisma.amenidad.upsert({
      where: { nombre: amenidad.nombre },
      update: {},
      create: amenidad,
    })
  }

  console.log(`✅ ${amenidades.length} amenidades creadas`)
  console.log('🌱 Seed completado')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
