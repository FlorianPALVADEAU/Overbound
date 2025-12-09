import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendPopupSubscribeConfirmationEmail } from '@/lib/email'

const subscribeSchema = z.object({
  email: z.string().email('Email invalide'),
  full_name: z.string().min(1, 'Le prénom est requis'),
  promotion_id: z.string().uuid('ID de promotion invalide'),
})

/**
 * POST /api/promotions/popup-subscribe
 * Subscribe an email to all marketing lists via popup promotion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscribeSchema.parse(body)

    const supabase = await createClient()

    // Normaliser l'email
    const email = validatedData.email.toLowerCase().trim()
    const fullName = validatedData.full_name.trim()

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

    // Vérifier si cet email existe déjà dans auth.users
    const admin = supabaseAdmin()
    const { data: authUser } = await admin.auth.admin.listUsers()
    const existingUser = authUser.users.find((u) => u.email?.toLowerCase() === email)
    const userId = existingUser?.id

    // Vérifier quelles subscriptions existent déjà (utiliser admin pour contourner RLS)
    let existingSubscriptions
    if (userId) {
      const { data } = await admin
        .from('list_subscriptions')
        .select('list_id')
        .eq('user_id', userId)
        .in('list_id', marketingLists.map((l) => l.id))
      existingSubscriptions = data || []
    } else {
      const { data } = await admin
        .from('list_subscriptions')
        .select('list_id')
        .eq('email', email)
        .in('list_id', marketingLists.map((l) => l.id))
      existingSubscriptions = data || []
    }

    const existingListIds = new Set(existingSubscriptions.map((s) => s.list_id))

    // Créer les subscriptions uniquement pour les listes non existantes
    const newSubscriptions = marketingLists
      .filter((list) => !existingListIds.has(list.id))
      .map((list) => ({
        list_id: list.id,
        user_id: userId || null,
        email: userId ? null : email,
        full_name: userId ? null : fullName,
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
        userId: userId,
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
