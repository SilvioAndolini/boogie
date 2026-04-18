import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing admin configuration. Check environment variables.')
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}
