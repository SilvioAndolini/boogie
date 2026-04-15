'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function loginWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('[loginWithGoogle] Error:', error.message)
    return { error: 'No se pudo iniciar sesión con Google. Intenta de nuevo.' }
  }

  if (data.url) {
    return { url: data.url }
  }

  return { error: 'Error inesperado con Google OAuth.' }
}
