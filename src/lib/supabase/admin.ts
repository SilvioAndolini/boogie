import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Your project\'s URL and Key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api')
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
