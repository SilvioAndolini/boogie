'use client'

import { motion } from 'framer-motion'
import { PropertyCard, type PropiedadCard } from './property-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Home } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

interface PropertyGridProps {
  propiedades: PropiedadCard[]
}

export function PropertyGrid({ propiedades }: PropertyGridProps) {
  if (propiedades.length === 0) {
    return (
      <EmptyState
        icono={Home}
        titulo="No se encontraron Boogies"
        descripcion="Prueba ajustando los filtros de búsqueda o explora otras zonas de Venezuela."
      />
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {propiedades.map((propiedad) => (
        <motion.div key={propiedad.id} variants={cardVariants}>
          <PropertyCard propiedad={propiedad} />
        </motion.div>
      ))}
    </motion.div>
  )
}
