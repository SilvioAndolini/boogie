// Sidebar del panel de usuario
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    titulo: 'Dashboard',
    href: '/dashboard',
    icono: LayoutDashboard,
  },
  {
    titulo: 'Mis boogies',
    href: '/dashboard/mis-propiedades',
    icono: Home,
  },
  {
    titulo: 'Mis reservas',
    href: '/dashboard/mis-reservas',
    icono: CalendarDays,
  },
  {
    titulo: 'Reservas recibidas',
    href: '/dashboard/reservas-recibidas',
    icono: Inbox,
  },
  {
    titulo: 'Pagos',
    href: '/dashboard/pagos',
    icono: CreditCard,
  },
  {
    titulo: 'Mi perfil',
    href: '/dashboard/perfil',
    icono: User,
  },
  {
    titulo: 'Verificar identidad',
    href: '/dashboard/verificar-identidad',
    icono: Shield,
  },
  {
    titulo: 'Configuración',
    href: '/dashboard/pagos/configuracion',
    icono: Settings,
  },
]

const sidebarVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
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

  return (
    <motion.nav
      className="w-60 space-y-1"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {menuItems.map((item) => {
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
    </motion.nav>
  )
}
