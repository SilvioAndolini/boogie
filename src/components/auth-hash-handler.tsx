'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthHashHandler() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    if (code) {
      const type = searchParams.get('type')
      const redirectUrl = '/auth/callback?code=' + encodeURIComponent(code)
      window.location.href = type ? redirectUrl + '&type=' + encodeURIComponent(type) : redirectUrl
      return
    }

    const hash = window.location.hash
    if (!hash) return

    const hashParams = new URLSearchParams(hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

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
  }, [])

  return null
}
