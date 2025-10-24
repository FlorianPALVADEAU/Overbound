import { NextRequest, NextResponse } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'

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
      .min(2, { message: 'Le nom complet doit contenir au moins 2 caractères.' })
      .max(150, { message: 'Le nom complet est trop long.' }),
  ),
  phone: preprocessOptionalString(
    z
      .string()
      .min(6, { message: 'Le numéro de téléphone doit contenir au moins 6 chiffres.' })
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
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
