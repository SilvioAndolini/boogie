import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY is required for admin operations. ' +
      'Check your Supabase project\'s API settings: https://supabase.com/dashboard/project/_/settings/api'
    )
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
