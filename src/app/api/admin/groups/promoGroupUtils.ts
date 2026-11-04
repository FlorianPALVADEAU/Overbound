import { z } from 'zod'
import type { supabaseAdmin } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof supabaseAdmin>

export const resolvePromoCode = async (admin: AdminClient, promotionalCodeInput: string) => {
  const normalized = promotionalCodeInput.trim()
  if (!normalized) return null

  const { data: byId } = await admin
    .from('promotional_codes')
    .select('id, code')
    .eq('id', normalized)
    .maybeSingle()

  if (byId) return byId

  const { data: byCode } = await admin
    .from('promotional_codes')
    .select('id, code')
    .ilike('code', normalized.toUpperCase())
    .maybeSingle()

  return byCode ?? null
}

const registrantRowsSchema = z.array(z.object({ user_id: z.string().uuid() }))

/**
 * Profils inscrits avec ce code promo. Une seule lecture ciblée (RPC admin_promo_registrant_user_ids) :
 * pas de scan de l'annuaire Auth. Les inscriptions sans user_id sont rapprochées par email dans la base.
 */
export const getUserIdsFromPromoRegistrations = async (admin: AdminClient, promotionalCodeId: string) => {
  const { data, error } = await admin.rpc('admin_promo_registrant_user_ids', {
    p_promotional_code_id: promotionalCodeId,
  })

  if (error) {
    throw error
  }

  const parsed = registrantRowsSchema.safeParse(data ?? [])
  if (!parsed.success) {
    throw new Error('admin_promo_registrant_user_ids: réponse inattendue')
  }

  return Array.from(new Set(parsed.data.map((row) => row.user_id)))
}
