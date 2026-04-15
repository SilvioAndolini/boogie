'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ZONAS } from '@/lib/zonas'

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
    <section className="relative py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {ZONAS.map((zona) => {
            const ZIcon = zona.Icon
            return (
              <motion.div key={zona.slug} variants={cardVariants}>
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
      </div>
    </section>
  )
}
