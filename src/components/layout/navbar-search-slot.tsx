'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { SearchBar } from '@/components/busqueda/search-bar'
import type { SearchMode } from '@/lib/constants'

function NavbarSearchContent({ mode, onModeChange }: { mode: SearchMode; onModeChange: (mode: SearchMode) => void }) {
  return (
    <SearchBar mode={mode} inlineModeToggle onModeChange={onModeChange} />
  )
}

export function NavbarSearchSlot() {
  const pathname = usePathname()
  const router = useRouter()
  const isPropiedades = pathname.startsWith('/propiedades')
  const isCanchas = pathname.startsWith('/canchas')

  if (!isPropiedades && !isCanchas) return null

  const mode: SearchMode = isCanchas ? 'sports' : 'estandar'

  const handleModeChange = (newMode: SearchMode) => {
    if (newMode === 'sports') {
      router.push('/canchas')
    } else {
      router.push('/propiedades')
    }
  }

  return (
    <div className="flex-1 max-w-3xl mx-4 hidden sm:block">
      <Suspense fallback={<div className="h-11 rounded-full bg-[#F8F6F3]" />}>
        <NavbarSearchContent mode={mode} onModeChange={handleModeChange} />
      </Suspense>
    </div>
  )
}
