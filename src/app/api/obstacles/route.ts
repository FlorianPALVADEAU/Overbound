import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isPublicObstacleVisible } from '@/lib/obstaclesVisibility'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.from('obstacles').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []).filter((obstacle) => isPublicObstacleVisible(obstacle?.name)))
}
