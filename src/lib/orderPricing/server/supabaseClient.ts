import type { SupabaseClient } from '@supabase/supabase-js'

/** Any Supabase client: the session one in routes, the admin one where RLS must be bypassed. */
export type PricingSupabase = SupabaseClient
