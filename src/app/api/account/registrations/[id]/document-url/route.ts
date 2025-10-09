import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import storageClient from '@/app/api/upload/document/storage'

const BUCKET_NAME = 'registration-documents'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'inscription appartient à l'utilisateur
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, user_id, email, document_url')
      .eq('id', id)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    // Vérifier la propriété
    const userEmail = user.email
    if (registration.user_id !== user.id && registration.email !== userEmail) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    if (!registration.document_url) {
      return NextResponse.json(
        { error: 'Aucun document disponible' },
        { status: 404 }
      )
    }

    // Extraire le chemin du fichier (supporte ancien format URL et nouveau format chemin)
    const extractPath = (value: string): string | null => {
      if (!value) return null
      const marker = `${BUCKET_NAME}/`
      if (value.includes(marker)) {
        return value.slice(value.indexOf(marker) + marker.length)
      }
      try {
        const parsed = new URL(value)
        const idx = parsed.pathname.indexOf(marker)
        if (idx >= 0) {
          return parsed.pathname.slice(idx + marker.length)
        }
      } catch {
        // value is probably already a path
      }
      return value
    }

    const objectPath = extractPath(registration.document_url)
    if (!objectPath) {
      return NextResponse.json(
        { error: 'Document introuvable' },
        { status: 404 }
      )
    }

    // Générer une URL signée valide 1 heure
    const { data, error } = await storageClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(objectPath, 3600)

    if (error || !data?.signedUrl) {
      console.error('Erreur génération URL signée:', error)
      return NextResponse.json(
        { error: 'Impossible de générer l\'URL du document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('Erreur récupération document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
