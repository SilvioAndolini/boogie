'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { SearchBar } from '@/components/busqueda/search-bar'
import type { SearchMode } from '@/lib/constants'

function NavbarSearchContent({ mode }: { mode: SearchMode }) {
  return (
    <SearchBar mode={mode} />
  )
}

export function NavbarSearchSlot() {
  const pathname = usePathname()
  const isPropiedades = pathname.startsWith('/propiedades')
  const isCanchas = pathname.startsWith('/canchas')

  if (!isPropiedades && !isCanchas) return null

  const mode: SearchMode = isCanchas ? 'sports' : 'estandar'

  return (
    <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
      <Suspense fallback={<div className="h-11 rounded-full bg-[#F8F6F3]" />}>
        <NavbarSearchContent mode={mode} />
      </Suspense>
    </div>
  )
}