import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const registrationId = formData.get('registration_id') as string

    if (!file || !registrationId) {
      return NextResponse.json(
        { error: 'Fichier ou ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'inscription appartient à l'utilisateur
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, user_id, email')
      .eq('id', registrationId)
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

    // Valider le fichier
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé (PDF, JPG, PNG uniquement)' },
        { status: 400 }
      )
    }

    // Upload vers Supabase Storage
    const fileName = `${registrationId}-${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('registration-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('registration-documents')
      .getPublicUrl(fileName)

    // Mettre à jour l'inscription avec les infos du document
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        document_url: publicUrl,
        document_filename: file.name,
        document_size: file.size,
        approval_status: 'pending'
      })
      .eq('id', registrationId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      document_url: publicUrl,
      filename: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}