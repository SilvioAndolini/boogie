'use client'

import { AuthHashHandler } from '@/components/auth-hash-handler'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthHashHandler />
      {children}
    </>
  )
}
