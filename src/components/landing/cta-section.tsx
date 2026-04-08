'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
<section className="relative bg-[#1B4332] py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-float-a absolute top-0 right-0 h-96 w-96 translate-x-1/3 rounded-full bg-[#52B788] opacity-15 blur-3xl" />
        <div className="glow-float-b absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 rounded-full bg-[#1B4332] opacity-20 blur-3xl" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl font-bold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          ¿Tienes un espacio para compartir?
        </motion.h2>
        <motion.p
          className="mx-auto mt-4 max-w-2xl text-[#D8F3DC]"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Publica tu alojamiento en Boogie y empieza a ganar dinero. Miles de viajeros están buscando un lugar como el tuyo.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/dashboard/mis-propiedades/nueva">
            <Button className="bg-[#52B788] px-8 text-white hover:bg-[#40916c]">
              Publicar alojamiento
            </Button>
          </Link>
          <Link href="/como-funciona">
            <Button variant="outline" className="border-white/30 px-8 text-white hover:bg-white/10">
              Conoce más
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
