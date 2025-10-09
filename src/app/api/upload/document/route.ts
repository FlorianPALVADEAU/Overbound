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
    const desiredFileSizeLimit = 20 * 1024 * 1024 // 20MB
    const fileName = `${registrationId}-${Date.now()}-${file.name}`

    const ensureBucket = async () => {
      const {
        data: bucketData,
        error: bucketError,
      } = await storageClient.storage.getBucket(bucketName)

      if (bucketError && bucketError.status === 404) {
        const { error: createError } = await storageClient.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: `${desiredFileSizeLimit}`,
        })

        if (createError && createError.status !== 409) {
          throw createError
        }
      } else if (bucketError && bucketError.status !== 200) {
        throw bucketError
      } else if (bucketData) {
        const currentLimit = Number((bucketData as Record<string, any>).file_size_limit ?? 0)
        if (!currentLimit || currentLimit < desiredFileSizeLimit) {
          const { error: updateError } = await storageClient.storage.updateBucket(bucketName, {
            fileSizeLimit: `${desiredFileSizeLimit}`,
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
        fileSizeLimit: `${desiredFileSizeLimit}`,
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

    const {
      data: { publicUrl },
    } = storageClient.storage.from(bucketName).getPublicUrl(fileName)

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
