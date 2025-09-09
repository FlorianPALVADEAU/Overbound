import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { postsQuery } from '@/sanity/lib/queries'
import axiosClient from '../../axiosClient'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data } = await axiosClient.get(postsQuery)

  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }

  return NextResponse.json(data)
}