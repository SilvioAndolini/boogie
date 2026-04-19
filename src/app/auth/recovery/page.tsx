'use client'

import { useEffect, useState } from 'react'
import { exchangePkceCode } from '@/actions/auth.actions'

const PKCE_KEY = 'pkce_code_verifier'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function getPkceVerifier(): string | null {
  const fromStorage = localStorage.getItem(PKCE_KEY)
  if (fromStorage) {
    localStorage.removeItem(PKCE_KEY)
    document.cookie = `${PKCE_KEY}=; path=/; max-age=0`
    return fromStorage
  }
  const fromCookie = getCookie(PKCE_KEY)
  if (fromCookie) {
    document.cookie = `${PKCE_KEY}=; path=/; max-age=0`
    return fromCookie
  }
  return null
}

export default function RecoveryPage() {
  const [status, setStatus] = useState<'exchanging' | 'error'>('exchanging')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      console.error('[recovery] No code param')
      window.location.href = '/recuperar-contrasena?error=nocode'
      return
    }

    const codeVerifier = getPkceVerifier()

    if (!codeVerifier) {
      console.error('[recovery] No code_verifier in localStorage')
      window.location.href = '/recuperar-contrasena?error=expired'
      return
    }

    exchangePkceCode(code, codeVerifier)
      .then(async (result) => {
        if (result?.error || !result?.accessToken || !result?.refreshToken) {
          console.error('[recovery] Exchange failed:', result?.error)
          window.location.href = '/recuperar-contrasena?error=exchange'
          return
        }

        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { error } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })

        if (error) {
          console.error('[recovery] setSession error:', error.message)
          window.location.href = '/recuperar-contrasena?error=session'
          return
        }

        window.location.href = '/recuperar-contrasena?type=recovery'
      })
      .catch((err) => {
        console.error('[recovery] Error:', err)
        window.location.href = '/recuperar-contrasena?error=exchange'
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'exchanging' && (
        <div className="animate-spin h-8 w-8 border-4 border-[#1B4332] border-t-transparent rounded-full" />
      )}
    </div>
  )
}
