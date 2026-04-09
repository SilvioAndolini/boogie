'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { SearchBar } from '@/components/busqueda/search-bar'

function NavbarSearchContent() {
  return (
    <SearchBar />
  )
}

export function NavbarSearchSlot() {
  const pathname = usePathname()
  const showSearch = pathname.startsWith('/propiedades')

  if (!showSearch) return null

  return (
    <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
      <Suspense fallback={<div className="h-11 rounded-full bg-[#F8F6F3]" />}>
        <NavbarSearchContent />
      </Suspense>
    </div>
  )
}