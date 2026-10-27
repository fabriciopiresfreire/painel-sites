import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Flag para o front funcionar mesmo antes da infra estar ligada.
export const supabaseReady = Boolean(url && anonKey)

if (!supabaseReady) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Preencha o .env para ativar login e banco.',
  )
}

// Cliente real quando configurado; placeholder seguro caso contrário.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
)
