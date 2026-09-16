import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { UpdateDistributionListData } from '@/types/DistributionList'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// Validation schema for update
const updateDistributionListSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  type: z
    .enum([
      'marketing',
      'transactional',
      'events',
      'volunteers',
      'partners',
      'news',
      'blog',
    ])
    .optional(),
  default_subscribed: z.boolean().optional(),
  active: z.boolean().optional(),
})

/**
 * GET /api/admin/distribution-lists/[id]
 * Get a single distribution list (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createClient()
    const { id } = await params

    // Get the distribution list
    const { data, error } = await supabase
      .from('distribution_lists')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Distribution list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Distribution list GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/distribution-lists/[id]
 * Update a distribution list (admin only)
 */
async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createClient()
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateDistributionListSchema.parse(body)

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    // If updating slug, check if it's already taken
    if (validatedData.slug) {
      const { data: existing } = await supabase
        .from('distribution_lists')
        .select('id')
        .eq('slug', validatedData.slug)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'Une liste avec ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Update the distribution list
    const { data, error } = await supabase
      .from('distribution_lists')
      .update(validatedData as UpdateDistributionListData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating distribution list:', error)
      return NextResponse.json(
        { error: 'Failed to update distribution list' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Distribution list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { data, message: 'Liste de distribution mise à jour avec succès' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Distribution list PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/distribution-lists/[id]
 * Delete a distribution list (admin only)
 */
async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createClient()
    const { id } = await params

    // Delete the distribution list (cascades to subscriptions)
    const { error } = await supabase
      .from('distribution_lists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting distribution list:', error)
      return NextResponse.json(
        { error: 'Failed to delete distribution list' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Liste de distribution supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Distribution list DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour liste de distribution admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression liste de distribution admin',
})
