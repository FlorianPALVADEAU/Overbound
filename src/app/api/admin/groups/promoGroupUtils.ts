import type { supabaseAdmin } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof supabaseAdmin>

const MAX_USERS = 5000
const PAGE_SIZE = 1000

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

export const getUserIdsFromPromoRegistrations = async (admin: AdminClient, promotionalCodeId: string) => {
  const { data: registrationRows, error } = await admin
    .from('registrations')
    .select('user_id, email')
    .eq('promotional_code_id', promotionalCodeId)

  if (error) {
    throw error
  }

  const directIds = new Set<string>()
  const missingEmails = new Set<string>()

  for (const row of registrationRows ?? []) {
    if (row.user_id) {
      directIds.add(row.user_id)
      continue
    }
    if (row.email && row.email.trim().length > 0) {
      missingEmails.add(row.email.trim().toLowerCase())
    }
  }

  if (missingEmails.size > 0) {
    const pendingEmails = new Set(missingEmails)
    for (let page = 1; pendingEmails.size > 0; page += 1) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
      if (listError) throw listError

      const users = data.users ?? []
      for (const authUser of users) {
        const email = authUser.email?.trim().toLowerCase()
        if (email && pendingEmails.has(email)) {
          directIds.add(authUser.id)
          pendingEmails.delete(email)
        }
      }

      if (users.length < PAGE_SIZE || page * PAGE_SIZE >= MAX_USERS) {
        break
      }
    }
  }

  return Array.from(directIds)
}
