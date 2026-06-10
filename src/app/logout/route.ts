import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

const redirectToHome = () =>
  NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))

export async function POST() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  return redirectToHome()
}

export async function GET() {
  return redirectToHome()
}
