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
  const seccionesRaw = (secciones || []) as Array<Record<string, unknown>>

  const seccionesData: SeccionConPropiedades[] = seccionesRaw.map((s) => {
    const props = (s.propiedades || []) as Array<Record<string, unknown>>
    return {
      id: s.id as string,
      titulo: s.titulo as string,
      subtitulo: (s.subtitulo as string) || null,
      tipo_filtro: s.tipo_filtro as string,
      propiedades: props.map((p) => ({
        id: p.id as string,
        titulo: p.titulo as string,
        tipoPropiedad: (p.tipo_propiedad ?? p.tipoPropiedad) as string,
        precioPorNoche: (p.precio_por_noche ?? p.precioPorNoche ?? 0) as number,
        moneda: (p.moneda ?? 'USD') as string,
        ciudad: (p.ciudad ?? '') as string,
        estado: (p.estado ?? '') as string,
        slug: (p.slug ?? '') as string,
        habitaciones: (p.habitaciones ?? 0) as number,
        camas: (p.camas ?? 0) as number,
        banos: (p.banos ?? 0) as number,
        imagenes: (p.imagenes ?? []) as string[],
        ratingPromedio: (p.rating_promedio ?? p.ratingPromedio ?? 0) as number,
        totalResenas: (p.total_resenas ?? p.totalResenas ?? 0) as number,
        planPropietario: (p.plan_propietario ?? p.planPropietario) as string | undefined,
      })),
    }
  })

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
