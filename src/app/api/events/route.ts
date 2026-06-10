import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.from('events').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const eventsWithEffectiveStatus = (data ?? []).map((event) => ({
    ...event,
    status: getEffectiveEventStatus(event),
  }))

  return NextResponse.json(eventsWithEffectiveStatus)
}
