'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Waves, Building2, Clock } from 'lucide-react'

const ZONAS_DESTACADAS = [
  { nombre: 'Caracas', estado: 'Distrito Capital', Icon: Building2, slug: 'distrito-capital', color: 'from-[#6B6560]/20 to-[#1A1A1A]/20' },
  { nombre: 'Vargas', estado: 'Vargas', Icon: Waves, slug: 'vargas', color: 'from-[#52B788]/20 to-[#2D6A4F]/20' },
]

const PROXIMAMENTE = [
  { nombre: 'Margarita', estado: 'Nueva Esparta' },
  { nombre: 'Mérida', estado: 'Mérida' },
  { nombre: 'Los Roques', estado: 'Distrito Capital' },
  { nombre: 'Canaima', estado: 'Bolívar' },
  { nombre: 'Choroní', estado: 'Aragua' },
  { nombre: 'Colonia Tovar', estado: 'Aragua' },
  { nombre: 'Los Llanos', estado: 'Barinas' },
  { nombre: 'Parque Nacional', estado: 'Canaima' },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export function ZonasSection() {
  return (
    <section className="bg-[#FEFCF9] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Explora por zona</h2>
          <p className="mt-2 text-[#6B6560]">Descubre destinos increíbles en toda Venezuela</p>
        </motion.div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 max-w-xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {ZONAS_DESTACADAS.map((zona) => {
            const ZIcon = zona.Icon
            return (
              <motion.div key={zona.nombre} variants={cardVariants}>
                <Link
                  href={`/zonas/${zona.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-[#E8E4DF] bg-white p-6 transition-all hover:border-[#52B788] hover:shadow-md"
                >
                  <motion.div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${zona.color}`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ZIcon className="h-6 w-6 text-[#1B4332]" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#1A1A1A]">{zona.nombre}</div>
                    <div className="text-xs text-[#6B6560]">{zona.estado}</div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <Clock className="h-5 w-5 text-[#1B4332]" />
            <h3 className="text-xl font-semibold text-[#1A1A1A]">Próximamente disponible</h3>
          </div>
          <p className="text-center text-[#6B6560] mb-8">Estamos trabajando para traerte más destinos en Venezuela</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {PROXIMAMENTE.map((zona) => (
              <div
                key={zona.nombre}
                className="flex items-center gap-2 rounded-lg border border-dashed border-[#D0CBC4] bg-[#F8F6F3]/50 px-3 py-2.5"
              >
                <span className="text-sm text-[#6B6560]">{zona.nombre}</span>
                <span className="text-xs text-[#A8A5A0]">({zona.estado})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
