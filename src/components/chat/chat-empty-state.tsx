'use client'

import { MessageCircle } from 'lucide-react'

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D8F3DC]">
        <MessageCircle className="h-8 w-8 text-[#1B4332]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#1A1A1A]">Sin conversaciones</p>
        <p className="mt-1 text-xs text-[#9E9892]">
          Contacta a un anfitrión desde el detalle de un Boogie
        </p>
      </div>
    </div>
  )
}
