import { NextRequest, NextResponse } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const preprocessOptionalString = <T extends ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined
      }
      if (value === null) {
        return null
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length === 0 ? null : trimmed
      }
      return value
    },
    schema.nullable().optional(),
  )

const updateProfileSchema = z.object({
  full_name: preprocessOptionalString(
    z
      .string()
      .min(1, { message: 'Le nom complet doit contenir au moins 1 caractère.' })
      .max(150, { message: 'Le nom complet est trop long.' }),
  ),
  phone: preprocessOptionalString(
    z
      .string()
      .min(1, { message: 'Le numéro de téléphone est invalide.' })
      .max(32, { message: 'Le numéro de téléphone est trop long.' }),
  ),
  date_of_birth: preprocessOptionalString(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Le format de la date doit être YYYY-MM-DD.' }),
  ),
  marketing_opt_in: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (typeof value === 'string') {
        const normalized = value.toLowerCase()
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true
        if (['false', '0', 'no', 'off'].includes(normalized)) return false
        return undefined
      }
      return value
    })
    .refine((value) => value === undefined || typeof value === 'boolean', {
      message: 'Valeur de consentement invalide.',
    }),
})

const validateBirthdate = (date: string) => {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  const today = new Date()
  if (parsed > today) {
    return false
  }

  const earliest = new Date('1900-01-01')
  return parsed >= earliest
}

const resolveAuthenticatedUser = async (
  request: NextRequest,
): Promise<User | null> => {
  const supabase = await createSupabaseServer()
  const admin = supabaseAdmin()

  const {
    data: { user: directUser },
  } = await supabase.auth.getUser()

  if (directUser) {
    return directUser
  }

  const authorizationHeader = request.headers.get('authorization')
  if (authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authorizationHeader.slice(7).trim()
    if (token) {
      const {
        data: { user: tokenUser },
      } = await admin.auth.getUser(token)
      if (tokenUser) {
        return tokenUser
      }
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.user ?? null
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }

    const parsed = updateProfileSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Champs invalides.', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const updates = parsed.data
    if (typeof updates.date_of_birth === 'string' && !validateBirthdate(updates.date_of_birth)) {
      return NextResponse.json({ error: 'La date de naissance est invalide.' }, { status: 422 })
    }

    const hasChanges = Object.values(updates).some((value) => value !== undefined)
    if (!hasChanges) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 })
    }

    const updatePayload: Record<string, string | boolean | null> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updatePayload[key] = value
      }
    }

    const admin = supabaseAdmin()

    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          ...updatePayload,
        },
        { onConflict: 'id' },
      )
      .select('full_name, phone, date_of_birth, marketing_opt_in, role')
      .single()

    if (updateError) {
      console.error('[account profile] update error', updateError)
      return NextResponse.json(
        { error: 'Impossible de mettre à jour le profil.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('[account profile] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
