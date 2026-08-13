import { createClient } from '@supabase/supabase-js'

// Client Supabase côté navigateur. Utilise UNIQUEMENT la clé anon publique :
// toutes les opérations passent par la Row Level Security définie dans schema.sql.
const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // Message explicite plutôt qu'une page blanche si l'env n'est pas configuré.
  // eslint-disable-next-line no-console
  console.warn(
    '[Atelier Terre] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants. ' +
      'Copiez .env.example en .env et renseignez vos clés Supabase.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const isSupabaseConfigured = Boolean(url && anonKey)
