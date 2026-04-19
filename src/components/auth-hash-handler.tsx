'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (type === 'recovery' && accessToken && refreshToken) {
      const supabase = createClient()

      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[AuthHashHandler] setSession error:', error.message)
            window.location.href = '/recuperar-contrasena?error=session'
            return
          }

          window.location.hash = ''
          window.location.href = '/recuperar-contrasena?type=recovery'
        })
    }
  }, [router])

  return null
}
