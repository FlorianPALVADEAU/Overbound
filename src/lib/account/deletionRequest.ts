import type { SupabaseClient } from '@supabase/supabase-js'

export type DeletionRequestResult = 'created' | 'already_pending'

const UNIQUE_VIOLATION = '23505'

/** Records an erasure request. One pending request per user: a repeat call is a no-op, not an error. */
export async function createDeletionRequest(
  admin: SupabaseClient,
  user: { id: string; email: string },
): Promise<DeletionRequestResult> {
  const { error } = await admin.from('account_deletion_requests').insert({ user_id: user.id, email: user.email })

  if (!error) return 'created'
  if (error.code === UNIQUE_VIOLATION) return 'already_pending'
  throw new Error(`Impossible d'enregistrer la demande de suppression : ${error.message}`)
}
