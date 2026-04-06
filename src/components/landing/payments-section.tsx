'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CreditCard, Smartphone, Building2, Coins, Banknote, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const METODOS = [
  { nombre: 'Pago Móvil', icon: Smartphone },
  { nombre: 'Zelle', icon: BadgeCheck },
  { nombre: 'Transferencia', icon: Building2 },
  { nombre: 'USDT', icon: Coins },
  { nombre: 'Efectivo (Farmatodo)', icon: Banknote },
  { nombre: 'Tarjeta', icon: CreditCard },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export function PaymentsSection() {
  return (
    <section className="bg-[#FEFCF9] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: text content */}
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Paga como prefieras
              </h2>
              <p className="mt-4 text-[#6B6560]">
                Pago Móvil, Zelle, transferencia o efectivo con el metodo que
                prefieras. Aceptamos pagos locales e internacionales para tu
                comodidad.
              </p>
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Link href="/como-funciona#pagos">
                  <Button
                    variant="outline"
                    className="gap-2 border-[#1B4332] text-[#1B4332] hover:bg-[#D8F3DC]"
                  >
                    Conocer más
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right: payment method grid */}
            <div className="flex items-center justify-center bg-gradient-to-br from-[#D8F3DC] to-[#1B4332]/10 p-8 sm:p-12">
              <motion.div
                className="grid grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                {METODOS.map((metodo) => {
                  const Icon = metodo.icon
                  return (
                    <motion.div
                      key={metodo.nombre}
                      variants={itemVariants}
                      className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]">
                        <Icon className="h-4 w-4 text-[#1B4332]" />
                      </div>
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {metodo.nombre}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
