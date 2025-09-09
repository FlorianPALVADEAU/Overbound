import { NextResponse } from 'next/server'
import axiosClient from '@/app/api/axiosClient'
import { postBySlugQuery } from '@/sanity/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data } = await axiosClient.get(postBySlugQuery, {
      params: { slug }
    })

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Erreur GET post:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}