'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, User, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatePresence, motion } from 'framer-motion'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E4DF] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]">
            <span className="text-lg font-bold text-white">B</span>
          </div>
          <span className="text-xl font-bold text-[#1A1A1A]">Boogie</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/propiedades"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Buscar
          </Link>
          <Link
            href="/zonas"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Zonas
          </Link>
          <Link
            href="/como-funciona"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#D8F3DC] text-sm text-[#1B4332]">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                  <AvatarImage src="" />
                </Avatar>
              </Button>
            }>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem render={<Link href="/login" className="cursor-pointer" />}>
                  Iniciar sesión
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/registro" className="cursor-pointer" />}>
                  Registrarse
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard" className="cursor-pointer" />}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A] sm:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden border-t border-[#E8E4DF] bg-white sm:hidden"
          >
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href="/propiedades"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Buscar alojamientos
              </Link>
              <Link
                href="/zonas"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Zonas populares
              </Link>
              <Link
                href="/como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Cómo funciona
              </Link>
              <Link
                href="/dashboard/mis-propiedades/nueva"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Publicar tu espacio
              </Link>

              <div className="border-t border-[#E8E4DF] pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1B4332] transition-colors hover:bg-[#F8F6F3]"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1B4332] transition-colors hover:bg-[#F8F6F3]"
                >
                  Registrarse
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
