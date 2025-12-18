import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET endpoint to fetch the currently active tier-based promo code for an event
 * Uses the database function get_active_tier_promo_code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID manquant.' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // Use the database function to get active tier code
    const { data, error } = await admin.rpc('get_active_tier_promo_code', {
      p_event_id: eventId,
    })

    if (error) {
      console.error('Erreur récupération code tier actif:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération du code actif.' }, { status: 500 })
    }

    // The RPC returns an array, get first result
    const activeTierCode = data && data.length > 0 ? data[0] : null

    if (!activeTierCode) {
      return NextResponse.json({ activeTierCode: null }, { status: 200 })
    }

    return NextResponse.json({
      activeTierCode: {
        id: activeTierCode.id,
        code: activeTierCode.code,
        name: activeTierCode.name,
        discount_percent: activeTierCode.discount_percent,
        valid_until: activeTierCode.valid_until,
        usage_limit: activeTierCode.usage_limit,
        used_count: activeTierCode.used_count,
        tier_order: activeTierCode.tier_order,
        remaining_uses: activeTierCode.usage_limit
          ? activeTierCode.usage_limit - activeTierCode.used_count
          : null,
      },
    })
  } catch (error) {
    console.error('Erreur récupération code tier actif:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
