'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Wallet, Sparkles, Percent, Zap, Shield, Clock, ChevronRight } from 'lucide-react'

const METODOS = [
  { nombre: 'Pago Móvil', icon: '📱', color: 'bg-[#E0F2FE]', border: 'hover:border-[#0369A1]/30' },
  { nombre: 'Zelle', icon: '⚡', color: 'bg-[#D8F3DC]', border: 'hover:border-[#52B788]/30' },
  { nombre: 'Transferencia', icon: '🏦', color: 'bg-[#FEF3C7]', border: 'hover:border-[#92400E]/30' },
  { nombre: 'USDT', icon: '₮', color: 'bg-[#D8F3DC]', border: 'hover:border-[#1B4332]/30' },
  { nombre: 'Efectivo', icon: '💵', color: 'bg-[#F8F6F3]', border: 'hover:border-[#6B6560]/30' },
  { nombre: 'Tarjeta', icon: '💳', color: 'bg-[#E0F2FE]', border: 'hover:border-[#0369A1]/30' },
]

const WALLET_BENEFITS = [
  { icon: Zap, text: 'Pagos con un clic' },
  { icon: Shield, text: 'Sin comisiones' },
  { icon: Clock, text: 'Confirmación inmediata' },
]

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number]
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease },
  },
}

function GoldCard() {
  return (
    <div className="relative w-full min-w-[380px] max-w-[520px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] shadow-[0_8px_32px_rgba(15,23,42,0.4)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rotate-12 rounded-full bg-white/[0.07]" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rotate-12 rounded-full bg-black/[0.08]" />
        <div className="absolute -left-8 top-0 h-full w-24 rotate-12 bg-gradient-to-b from-white/[0.06] via-white/[0.12] to-white/[0.03]" />

        <div className="relative flex aspect-[1.586/1] flex-col justify-between p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold uppercase tracking-widest text-white/80">
              Boogie Wallet
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-7 w-9 items-center justify-center rounded-sm bg-[#fbbf24] shadow-inner" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Saldo disponible</p>
              <p className="text-xl font-extrabold text-white tabular-nums sm:text-2xl">
                $100.00
                <span className="ml-1 text-xs font-semibold text-white/50">USD</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
                María González
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PaymentsSection() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/30 px-4 py-1.5 text-sm font-medium text-[#1B4332]">
            <Wallet className="h-3.5 w-3.5" />
            Pagos flexibles
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] lg:text-4xl">Paga como prefieras</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#6B6560]">
            Aceptamos pagos locales e internacionales. Elige el método que más te convenga y reserva sin complicaciones.
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {METODOS.map((metodo) => (
            <motion.div
              key={metodo.nombre}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`group flex flex-col items-center gap-3 rounded-2xl border border-[#E8E4DF] bg-white p-5 text-center transition-all ${metodo.border} hover:shadow-md`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metodo.color} text-xl transition-transform group-hover:scale-110`}>
                {metodo.icon}
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">{metodo.nombre}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 relative rounded-3xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C]" />
          <div className="pointer-events-none absolute -right-20 -top-20 z-0">
            <div className="glow-float-a h-80 w-80 rounded-full bg-[#52B788]/20 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute -bottom-16 -left-16 z-0">
            <div className="glow-float-b h-64 w-64 rounded-full bg-[#95D5B2]/15 blur-3xl" />
          </div>

          <div className="relative z-10 p-8 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: easeOut }}
                >
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80">
                    <Sparkles className="h-3 w-3 text-[#52B788]" />
                    Funcionalidad estrella
                  </div>
                  <h3 className="text-3xl font-bold text-white lg:text-4xl">
                    Boogie Wallet
                  </h3>
                  <p className="mt-2 text-sm text-white/60">Tu monedero digital en la plataforma</p>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                    Recarga saldo una vez y paga todas tus reservas con un solo clic. Sin comisiones, sin esperas, sin complicaciones.
                  </p>
                </motion.div>

                <motion.div
                  className="mt-6 grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                >
                  {WALLET_BENEFITS.map((b) => (
                    <div key={b.text} className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-3 text-center">
                      <b.icon className="h-5 w-5 text-[#52B788]" />
                      <span className="text-[11px] font-medium text-white/80">{b.text}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  className="mt-6 flex items-center gap-3 rounded-xl border border-[#52B788]/30 bg-[#52B788]/10 px-4 py-3"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.25, ease }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#52B788]">
                    <Percent className="h-4 w-4 text-[#1B4332]" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Obtén un 5% de descuento en todos tus Boogies rents usando la Boogie Wallet!
                  </p>
                </motion.div>

                <motion.div
                  className="mt-6 flex flex-wrap items-center gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.35, ease }}
                >
                  <Link href="/dashboard/pagos/configuracion/wallet/recargar">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#1B4332] shadow-lg shadow-black/10 transition-all hover:bg-[#D8F3DC] hover:shadow-xl">
                      <Zap className="h-4 w-4" />
                      Recargar Wallet
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link href="/dashboard/pagos/configuracion" className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white">
                    Conocer más
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </div>

              <div className="flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotateY: -15 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
                >
                  <GoldCard />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
