'use client'

import { motion } from 'framer-motion'
import { PreviewRow } from './preview-row'

interface PropiedadPreview {
  id: string
  titulo: string
  tipoPropiedad: string
  precioPorNoche: number
  moneda: string
  ciudad: string
  estado: string
  slug: string
  habitaciones: number
  camas: number
  banos: number
  imagenes: string[]
  ratingPromedio: number
  totalResenas: number
}

interface SeccionConPropiedades {
  id: string
  titulo: string
  subtitulo: string | null
  tipo_filtro: string
  propiedades: PropiedadPreview[]
}

export function BoogiePreviewsSection({ secciones }: { secciones: unknown[] }) {
  const seccionesData = (secciones || []) as unknown as SeccionConPropiedades[]

  if (seccionesData.length === 0) return null

  return (
    <section className="relative py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Descubre Boogies increíbles</h2>
          <p className="mt-2 text-[#6B6560]">Los mejores alojamientos seleccionados para ti</p>
        </motion.div>

        <div className="space-y-12">
          {seccionesData.map((seccion) => (
            <PreviewRow
              key={seccion.id}
              titulo={seccion.titulo}
              subtitulo={seccion.subtitulo}
              propiedades={seccion.propiedades}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
