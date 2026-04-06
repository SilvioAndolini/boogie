'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Palmtree,
  Mountain,
  Waves,
  Building2,
  Tent,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const ZONAS_DESTACADAS = [
  { nombre: 'Margarita', estado: 'Nueva Esparta', Icon: Palmtree, slug: 'nueva-esparta', color: 'from-[#E76F51]/20 to-[#F4A261]/20' },
  { nombre: 'Los Roques', estado: 'Distrito Capital', Icon: Waves, slug: 'distrito-capital', color: 'from-[#52B788]/20 to-[#2D6A4F]/20' },
  { nombre: 'Mérida', estado: 'Mérida', Icon: Mountain, slug: 'merida', color: 'from-[#1B4332]/20 to-[#52B788]/20' },
  { nombre: 'Caracas', estado: 'Distrito Capital', Icon: Building2, slug: 'distrito-capital', color: 'from-[#6B6560]/20 to-[#1A1A1A]/20' },
  { nombre: 'Canaima', estado: 'Bolívar', Icon: Tent, slug: 'bolivar', color: 'from-[#D8F3DC] to-[#1B4332]/10' },
  { nombre: 'Choroní', estado: 'Aragua', Icon: Waves, slug: 'aragua', color: 'from-[#E76F51]/10 to-[#52B788]/20' },
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
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
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
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Link href="/zonas">
            <Button variant="outline" className="gap-2 border-[#1B4332] text-[#1B4332] hover:bg-[#D8F3DC]">
              Ver todos los destinos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
