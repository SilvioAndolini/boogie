import { Palmtree, Mountain, Waves, Building2, type LucideIcon } from 'lucide-react'

export interface ZonaConfig {
  nombre: string
  estado: string
  slug: string
  Icon: LucideIcon
  color: string
  imagen: string
  descripcion: string
}

export const ZONAS: ZonaConfig[] = [
  {
    nombre: 'Margarita',
    estado: 'Nueva Esparta',
    slug: 'nueva-esparta',
    Icon: Palmtree,
    color: 'from-[#52B788]/20 to-[#1B4332]/20',
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031165.jpg',
    descripcion: 'La Perla del Caribe: playas paradisíacas, Isla de Margarita y Margarita.',
  },
  {
    nombre: 'Caracas',
    estado: 'Distrito Capital',
    slug: 'distrito-capital',
    Icon: Building2,
    color: 'from-[#6B6560]/20 to-[#1A1A1A]/20',
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031165.jpg',
    descripcion: 'Caracas, la cosmopolita capital venezolana entre montañas.',
  },
  {
    nombre: 'La Guaira',
    estado: 'La Guaira',
    slug: 'la-guaira',
    Icon: Waves,
    color: 'from-[#52B788]/20 to-[#2D6A4F]/20',
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031541.jpg',
    descripcion: 'La costa central con playas, el aeropuerto internacional y El Ávila.',
  },
  {
    nombre: 'Miranda',
    estado: 'Miranda',
    slug: 'miranda',
    Icon: Building2,
    color: 'from-[#52B788]/20 to-[#1B4332]/20',
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031165.jpg',
    descripcion: 'Zona metropolitana de Caracas: Chacao, Altamira, Los Palos Grandes y más.',
  },
  {
    nombre: 'Colonia Tovar',
    estado: 'Aragua',
    slug: 'aragua',
    Icon: Mountain,
    color: 'from-[#2D6A4F]/20 to-[#D8F3DC]/20',
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031165.jpg',
    descripcion: 'Montañas, clima fresco, Colonia Tovar y Choroní en la costa aragüeña.',
  },
]

export const ZONAS_POR_SLUG = new Map(ZONAS.map(z => [z.slug, z]))
export const ZONAS_SLUGS = ZONAS.map(z => z.slug)
