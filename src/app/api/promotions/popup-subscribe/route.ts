import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendPopupSubscribeConfirmationEmail } from '@/lib/email'
import {
  mapSlugsToAudienceIds,
  subscribeResendContactToAudiences,
} from '@/lib/email/resendAudiences'

const subscribeSchema = z.object({
  email: z.string().trim().min(1, "L'adresse email est requise").email('Email invalide'),
  full_name: z.string().trim().min(1, 'Le prénom est requis'),
  promotion_id: z.string().uuid('ID de promotion invalide'),
  website: z.string().optional(),
  elapsed_ms: z.number().int().nonnegative().nullable().optional(),
})

const findAuthUserByEmail = async (
  admin: ReturnType<typeof supabaseAdmin>,
  email: string,
) => {
  const normalizedEmail = email.toLowerCase().trim()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const users = data.users ?? []
    const match = users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)
    if (match) {
      return match
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

/**
 * POST /api/promotions/popup-subscribe
 * Subscribe an email to all marketing lists via popup promotion
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = rateLimit(`popup-subscribe:${ip}`, 5, 60_000)
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }
    const body = await request.json()
    const validatedData = subscribeSchema.parse(body)
    const honeypotValue = validatedData.website?.trim()
    if (honeypotValue) {
      return NextResponse.json({ success: true, message: 'Inscription prise en compte.' }, { status: 201 })
    }
    if ((validatedData.elapsed_ms ?? 0) > 0 && (validatedData.elapsed_ms ?? 0) < 1500) {
      return NextResponse.json({ error: 'Requête rejetée.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Normaliser l'email
    const email = validatedData.email.toLowerCase().trim()
    const fullName = validatedData.full_name.trim()

    // Si un compte existe déjà avec cet email, ne rien enregistrer et inviter à se connecter.
    const admin = supabaseAdmin()
    const existingUser = await findAuthUserByEmail(admin, email)
    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Cette adresse email est déjà associée à un compte.',
          code: 'EMAIL_ALREADY_REGISTERED',
          redirect_to: '/auth/login',
        },
        { status: 409 }
      )
    }

    const { data: existingDatabaseSubscription } = await admin
      .from('list_subscriptions')
      .select('id')
      .eq('email', email)
      .limit(1)

    if ((existingDatabaseSubscription?.length ?? 0) > 0) {
      return NextResponse.json(
        {
          error: 'Cette adresse existe déjà dans notre base. Prochaine étape: crée ton compte.',
          code: 'EMAIL_ALREADY_IN_DATABASE',
          redirect_to: '/auth/register',
        },
        { status: 409 }
      )
    }

    // Vérifier que la promotion existe et est active
    const { data: promotion, error: promoError } = await supabase
      .from('site_promotions')
      .select('id, type, is_active')
      .eq('id', validatedData.promotion_id)
      .eq('type', 'popup')
      .eq('is_active', true)
      .single()

    if (promoError || !promotion) {
      return NextResponse.json(
        { error: 'Promotion introuvable ou inactive' },
        { status: 404 }
      )
    }

    // Récupérer toutes les listes marketing
    const { data: marketingLists, error: listsError } = await supabase
      .from('distribution_lists')
      .select('id, slug')

    if (listsError || !marketingLists || marketingLists.length === 0) {
      console.error('Error fetching marketing lists:', listsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des listes' },
        { status: 500 }
      )
    }

    const { audienceIds, missingSlugs } = mapSlugsToAudienceIds(marketingLists.map((list) => list.slug))
    if (audienceIds.length === 0) {
      return NextResponse.json(
        { error: 'Aucune audience Resend configurée pour les listes marketing.' },
        { status: 500 }
      )
    }

    if (missingSlugs.length > 0) {
      console.warn('[popup-subscribe] missing Resend audience mapping for slugs', missingSlugs)
    }

    await subscribeResendContactToAudiences({
      email,
      fullName,
      audienceIds,
      properties: {
        source: `popup-${validatedData.promotion_id}`,
      },
    })

    // Vérifier quelles subscriptions existent déjà (utiliser admin pour contourner RLS)
    const { data: existingSubscriptionsData } = await admin
      .from('list_subscriptions')
      .select('list_id')
      .eq('email', email)
      .in('list_id', marketingLists.map((l) => l.id))
    const existingSubscriptions = existingSubscriptionsData || []

    const existingListIds = new Set(existingSubscriptions.map((s) => s.list_id))

    // Créer les subscriptions uniquement pour les listes non existantes
    const newSubscriptions = marketingLists
      .filter((list) => !existingListIds.has(list.id))
      .map((list) => ({
        list_id: list.id,
        user_id: null,
        email,
        full_name: fullName,
        subscribed: true,
        subscribed_at: new Date().toISOString(),
        source: `popup-${validatedData.promotion_id}`,
      }))

    // Insérer seulement les nouvelles subscriptions (utiliser admin pour contourner RLS)
    if (newSubscriptions.length > 0) {
      const { error: subscriptionsError } = await admin
        .from('list_subscriptions')
        .insert(newSubscriptions)

      if (subscriptionsError) {
        console.error('Error creating subscriptions:', subscriptionsError)
        return NextResponse.json(
          { error: 'Erreur lors de l\'inscription' },
          { status: 500 }
        )
      }
    }

    // Envoyer l'email de confirmation (même si déjà abonné, pour confirmer l'action)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
      await sendPopupSubscribeConfirmationEmail({
        to: email,
        fullName: fullName,
        eventsUrl: `${baseUrl}/events`,
        blogUrl: `${baseUrl}/blog`,
      })
    } catch (emailError) {
      // Log l'erreur mais ne pas faire échouer la requête
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription réussie !',
        lists_count: marketingLists.length,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Popup subscribe error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
