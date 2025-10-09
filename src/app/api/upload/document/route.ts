import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
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

    const validationError = validateDocument(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const bucketName = 'registration-documents'
    const desiredFileSizeLimitBytes = 20 * 1024 * 1024 // 20MB
    const desiredFileSizeLimit = `${desiredFileSizeLimitBytes}`
    const fileName = `${registrationId}-${Date.now()}-${file.name}`

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
        const needsPublic = !(bucketData as Record<string, any>).public
        const needsLimitUpdate =
          !currentLimit ||
          Number.isNaN(currentLimit) ||
          currentLimit < desiredFileSizeLimitBytes

        if (needsPublic || needsLimitUpdate) {
          const { error: updateError } = await storageClient.storage.updateBucket(bucketName, {
            public: true,
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
        public: true,
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

    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        document_url: documentPath,
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
      document_url: documentPath,
      filename: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
