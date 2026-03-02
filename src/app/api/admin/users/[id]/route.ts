import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { sendAmbassadorCodeAssignedEmail, sendAmbassadorWelcomeEmail } from '@/lib/ambassadors/email'
import { z } from 'zod'
import { deleteResendContactByEmail } from '@/lib/email/resendAudiences'

const updateUserSchema = z
  .object({
    role: z.enum(['user', 'volunteer', 'admin', 'ambassador']).optional(),
    full_name: z.string().trim().min(2).max(120).nullable().optional(),
    phone: z.string().trim().min(6).max(32).nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    marketing_opt_in: z.boolean().nullable().optional(),
    ambassador_promotional_code_id: z.string().uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Aucune donnée à mettre à jour.',
  })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json()
    const validated = updateUserSchema.parse(payload)

    const admin = supabaseAdmin()
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', id)
      .maybeSingle()

    const targetRole = validated.role ?? currentProfile?.role ?? 'user'

    const { data: currentAmbassador } = await admin
      .from('ambassadors')
      .select('promotional_code_id')
      .eq('profile_id', id)
      .maybeSingle()

    const previousRole = currentProfile?.role ?? 'user'
    const previousPromoId = currentAmbassador?.promotional_code_id ?? null

    if (targetRole !== 'ambassador' && validated.ambassador_promotional_code_id) {
      return NextResponse.json({ error: 'Le code promo ambassadeur nécessite le rôle ambassadeur.' }, { status: 400 })
    }

    if (targetRole === 'admin' && validated.ambassador_promotional_code_id) {
      return NextResponse.json({ error: 'Un administrateur ne peut pas être ambassadeur.' }, { status: 400 })
    }

    if (targetRole === 'ambassador') {
      if (validated.ambassador_promotional_code_id === null) {
        return NextResponse.json({ error: 'Un ambassadeur doit avoir un code promo actif.' }, { status: 400 })
      }
      if (validated.ambassador_promotional_code_id === undefined && !currentAmbassador?.promotional_code_id) {
        return NextResponse.json({ error: 'Un ambassadeur doit avoir un code promo actif.' }, { status: 400 })
      }
    }

    if (validated.ambassador_promotional_code_id) {
      const { data: promoCode } = await admin
        .from('promotional_codes')
        .select('id, is_active')
        .eq('id', validated.ambassador_promotional_code_id)
        .maybeSingle()

      if (!promoCode || !promoCode.is_active) {
        return NextResponse.json({ error: 'Le code promo doit être actif.' }, { status: 400 })
      }

      const { data: assignedAmbassador } = await admin
        .from('ambassadors')
        .select('profile_id')
        .eq('promotional_code_id', validated.ambassador_promotional_code_id)
        .maybeSingle()

      if (assignedAmbassador && assignedAmbassador.profile_id !== id) {
        return NextResponse.json({ error: 'Ce code promo est déjà associé à un autre ambassadeur.' }, { status: 409 })
      }
    }

    const { data: updatedProfile, error } = await admin
      .from('profiles')
      .update({
        ...(validated.role !== undefined ? { role: validated.role } : {}),
        ...(validated.full_name !== undefined ? { full_name: validated.full_name } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
        ...(validated.date_of_birth !== undefined ? { date_of_birth: validated.date_of_birth } : {}),
        ...(validated.marketing_opt_in !== undefined ? { marketing_opt_in: validated.marketing_opt_in } : {}),
      })
      .eq('id', id)
      .select('id, full_name, role, phone, created_at, date_of_birth, marketing_opt_in')
      .single()

    if (error) {
      throw error
    }

    if (targetRole === 'ambassador' && validated.ambassador_promotional_code_id) {
      const { error: ambassadorError } = await admin
        .from('ambassadors')
        .upsert({
          profile_id: id,
          promotional_code_id: validated.ambassador_promotional_code_id,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' })

      if (ambassadorError) {
        console.error('[admin users] ambassador upsert error', ambassadorError)
        return NextResponse.json({ error: 'Impossible d\'associer le code promo ambassadeur.' }, { status: 500 })
      }
    }

    if (targetRole !== 'ambassador') {
      await admin
        .from('ambassadors')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('profile_id', id)
    }

    const { data: ambassadorRow } = await admin
      .from('ambassadors')
      .select('promotional_code_id, promo:promotional_codes(code, is_active)')
      .eq('profile_id', id)
      .maybeSingle()

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(id)
      const recipientEmail = authUser?.user?.email
      if (recipientEmail) {
        const fullName = updatedProfile.full_name ?? null
        const promoValue = Array.isArray((ambassadorRow as any)?.promo)
          ? (ambassadorRow as any)?.promo?.[0]
          : (ambassadorRow as any)?.promo
        const newPromoId = ambassadorRow?.promotional_code_id ?? null

        if (previousRole !== 'ambassador' && targetRole === 'ambassador') {
          await sendAmbassadorWelcomeEmail({ to: recipientEmail, fullName })
        }

        if (
          targetRole === 'ambassador' &&
          newPromoId &&
          newPromoId !== previousPromoId &&
          promoValue?.code
        ) {
          await sendAmbassadorCodeAssignedEmail({
            to: recipientEmail,
            fullName,
            ambassadorCode: promoValue.code,
          })
        }
      }
    } catch (emailError) {
      console.error('[admin users] ambassador email error', emailError)
    }

    return NextResponse.json({
      profile: {
        ...updatedProfile,
        ambassador_promotional_code_id: ambassadorRow?.promotional_code_id ?? null,
        ambassador_code: Array.isArray((ambassadorRow as any)?.promo)
          ? (ambassadorRow as any)?.promo?.[0]?.code ?? null
          : (ambassadorRow as any)?.promo?.code ?? null,
        ambassador_code_is_active: Array.isArray((ambassadorRow as any)?.promo)
          ? (ambassadorRow as any)?.promo?.[0]?.is_active ?? null
          : (ambassadorRow as any)?.promo?.is_active ?? null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('[admin users] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.id === id) {
      return NextResponse.json({ error: 'Impossible de supprimer votre propre compte.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()
    const { data: targetAuthUser, error: targetAuthUserError } = await admin.auth.admin.getUserById(id)
    if (targetAuthUserError) {
      throw targetAuthUserError
    }

    const targetEmail = targetAuthUser.user?.email?.trim().toLowerCase() || null
    if (targetEmail) {
      await deleteResendContactByEmail(targetEmail)
    }

    const { error: authError } = await admin.auth.admin.deleteUser(id)
    if (authError) {
      throw authError
    }

    const { error: profileError } = await admin.from('profiles').delete().eq('id', id)
    if (profileError) {
      console.error('[admin users] profile cleanup error', profileError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin users] delete error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
