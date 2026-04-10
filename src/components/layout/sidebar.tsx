'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Inbox,
  CreditCard,
  User,
  Settings,
  Shield,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    titulo: 'Dashboard',
    href: '/dashboard',
    icono: LayoutDashboard,
    grupo: 'general',
  },
  {
    titulo: 'Mis boogies',
    href: '/dashboard/mis-propiedades',
    icono: Home,
    grupo: 'general',
  },
  {
    titulo: 'Mis reservas',
    href: '/dashboard/mis-reservas',
    icono: CalendarDays,
    grupo: 'general',
  },
  {
    titulo: 'Reservas recibidas',
    href: '/dashboard/reservas-recibidas',
    icono: Inbox,
    grupo: 'general',
  },
  {
    titulo: 'Mensajes',
    href: '/dashboard/mensajes',
    icono: MessageCircle,
    grupo: 'general',
  },
  {
    titulo: 'Pagos',
    href: '/dashboard/pagos',
    icono: CreditCard,
    grupo: 'cuenta',
  },
  {
    titulo: 'Mi perfil',
    href: '/dashboard/perfil',
    icono: User,
    grupo: 'cuenta',
  },
  {
    titulo: 'Verificar identidad',
    href: '/dashboard/verificar-identidad',
    icono: Shield,
    grupo: 'cuenta',
  },
  {
    titulo: 'Configuración',
    href: '/dashboard/pagos/configuracion',
    icono: Settings,
    grupo: 'cuenta',
  },
]

const GRUPO_LABELS: Record<string, string> = {
  general: 'General',
  cuenta: 'Cuenta',
}

const GRUPO_ORDER = ['general', 'cuenta']

const sidebarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export function Sidebar() {
  const pathname = usePathname()

  const grouped = GRUPO_ORDER.map(grupo => ({
    label: GRUPO_LABELS[grupo],
    items: menuItems.filter(m => m.grupo === grupo),
  }))

  return (
    <motion.nav
      className="w-60 space-y-6"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {grouped.map(grupo => (
        <div key={grupo.label}>
          <motion.p
            variants={itemVariants}
            className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#9E9892]"
          >
            {grupo.label}
          </motion.p>
          <div className="space-y-1">
            {grupo.items.map(item => {
              const activo = pathname === item.href
              return (
                <motion.div key={item.href} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      activo
                        ? 'bg-[#D8F3DC] text-[#1B4332]'
                        : 'text-[#6B6560] hover:bg-[#F8F6F3] hover:text-[#1A1A1A]'
                    )}
                  >
                    <item.icono className="h-4 w-4" />
                    {item.titulo}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </motion.nav>
  )
}
