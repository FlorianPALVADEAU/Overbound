import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createSupabaseServer = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // La méthode setAll a été appelée depuis un Server Component.
            // Cela peut être ignoré si vous avez un middleware configuré pour
            // rafraîchir les sessions utilisateur.
            console.log('Erreur lors de la définition des cookies')
          }
        },
      },
    }
  )
}

// Alias pour compatibilité avec les routes API existantes
export const createClient = createSupabaseServer

// Admin client (service role)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export const supabaseAdmin = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )