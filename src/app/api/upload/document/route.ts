import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import storageClient from './storage'
import { validateDocument } from './validators'

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
    const documentTypeRaw = formData.get('document_type') as string | null

    if (!file || !registrationId) {
      return NextResponse.json(
        { error: 'Fichier ou ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'inscription appartient à l'utilisateur
    const { data: registration } = await supabase
      .from('registrations')
      .select(
        `
        id,
        user_id,
        email,
        event:events(date)
      `,
      )
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

    const validationError = validateDocument(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const eventDateRaw = Array.isArray((registration as any)?.event)
      ? (registration as any).event[0]?.date
      : (registration as any)?.event?.date
    const eventDate = eventDateRaw ? new Date(eventDateRaw) : null

    if (eventDate && isPpsDocumentType(documentTypeRaw)) {
      const earliestAllowed = new Date(eventDate)
      earliestAllowed.setMonth(earliestAllowed.getMonth() - 3)
      if (Date.now() < earliestAllowed.getTime()) {
        return NextResponse.json(
          {
            error:
              'Le PPS ne peut pas être déposé plus de 3 mois avant l’événement. Merci de revenir plus tard.',
          },
          { status: 400 },
        )
      }
    }

    const bucketName = 'registration-documents'
    const desiredFileSizeLimitBytes = 20 * 1024 * 1024 // 20MB
    const desiredFileSizeLimit = `${desiredFileSizeLimitBytes}`
    const safeDocumentType = (documentTypeRaw || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
    const safeFileName = file.name.replace(/[^\w.\-]/g, '_')
    const fileName = `${registrationId}/${safeDocumentType}-${Date.now()}-${safeFileName}`

    const ensureBucket = async () => {
      const {
        data: bucketData,
        error: bucketError,
      } = await storageClient.storage.getBucket(bucketName)

      if (bucketError) {
        throw bucketError
      } else if (bucketData) {
        const currentLimitRaw = (bucketData as Record<string, any>).file_size_limit as string | null
        const currentLimit = currentLimitRaw ? parseInt(currentLimitRaw, 10) : null
        const isPublic = Boolean((bucketData as Record<string, any>).public)
        const needsLimitUpdate =
          !currentLimit ||
          Number.isNaN(currentLimit) ||
          currentLimit < desiredFileSizeLimitBytes

        if (isPublic || needsLimitUpdate) {
          const { error: updateError } = await storageClient.storage.updateBucket(bucketName, {
            public: false,
            fileSizeLimit: desiredFileSizeLimit,
          })
          if (updateError) {
            throw updateError
          }
        }
      }
    }

    try {
      await ensureBucket()
    } catch (bucketSetupError) {
      console.error('Erreur préparation bucket:', bucketSetupError)
      return NextResponse.json({ error: 'Stockage indisponible pour le moment' }, { status: 500 })
    }

    const upload = async () =>
      storageClient.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

    let { error: uploadError } = await upload()

    if (
      uploadError &&
      String(uploadError.message ?? '').toLowerCase().includes('exceeded the maximum allowed size')
    ) {
      const { error: updateError } = await storageClient.storage.updateBucket(bucketName, {
        public: false,
        fileSizeLimit: desiredFileSizeLimit,
      })

      if (updateError) {
        console.error('Erreur mise à jour quota bucket:', updateError)
        throw updateError
      }

      const retry = await upload()
      uploadError = retry.error
    }

    if (uploadError) {
      throw uploadError
    }

    // Stocker le chemin complet du fichier dans le bucket
    const documentPath = `${bucketName}/${fileName}`

    const admin = supabaseAdmin()
    const normalizedDocumentType = documentTypeRaw && documentTypeRaw.trim().length > 0
      ? documentTypeRaw.trim()
      : 'document'

    const { data: storedDocument, error: documentInsertError } = await admin
      .from('registration_documents')
      .upsert(
        {
          registration_id: registrationId,
          document_type: normalizedDocumentType,
          document_url: documentPath,
          document_filename: file.name,
          document_size: file.size,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: 'registration_id,document_type' },
      )
      .select('id, document_type')
      .single()

    if (documentInsertError) {
      console.error('Erreur enregistrement document:', documentInsertError)
      // continue with legacy update to keep backward compatibility
    }

    const { error: updateError } = await admin
      .from('registrations')
      .update({
        document_url: documentPath,
        document_filename: file.name,
        document_size: file.size,
        approval_status: 'pending',
      })
      .eq('id', registrationId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      document_id: storedDocument?.id ?? null,
      document_type: storedDocument?.document_type ?? normalizedDocumentType,
      document_url: documentPath,
      filename: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const isPpsDocumentType = (value: string | null) => {
  if (!value) return false
  const normalized = value.toLowerCase()
  return normalized.includes('pps')
}
