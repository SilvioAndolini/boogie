'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, Shield } from 'lucide-react'

const PASOS = [
  {
    icon: Search,
    titulo: 'Busca',
    descripcion: 'Explora alojamientos en toda Venezuela. Filtra por ubicación, precio y amenidades.',
  },
  {
    icon: CreditCard,
    titulo: 'Reserva',
    descripcion: 'Elige tu lugar ideal y paga con el método que prefieras: Pago Móvil, Zelle, USDT y más.',
  },
  {
    icon: Shield,
    titulo: 'Disfruta',
    descripcion: 'Llega a tu destino y vive una experiencia única. Tu hogar lejos de casa te espera.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export function StepsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Cómo funciona</h2>
          <p className="mt-2 text-[#6B6560]">Reservar tu alojamiento es muy fácil</p>
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {PASOS.map((paso, i) => {
            const ZIcon = paso.icon
            return (
              <motion.div
                key={paso.titulo}
                variants={itemVariants}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector line */}
                {i < PASOS.length - 1 && (
                  <div className="absolute right-0 top-10 hidden h-px w-1/3 translate-x-1/2 bg-[#E8E4DF] sm:block" />
                )}

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8F3DC]">
                  <ZIcon className="h-7 w-7 text-[#1B4332]" />
                </div>
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1B4332] text-xs font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#1A1A1A]">{paso.titulo}</h3>
                <p className="mt-2 max-w-xs text-sm text-[#6B6560]">{paso.descripcion}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
