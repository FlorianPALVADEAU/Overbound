export type DocumentApprovalStatus = 'pending' | 'approved' | 'rejected' | null | undefined

type ComputeDocumentActionParams = {
  requiresDocument: boolean
  eventDate: string | Date | null | undefined
  approvalStatus: DocumentApprovalStatus
  requiredTypes?: string[] | null | undefined
  uploadedTypes?: string[] | null | undefined
  uploadedCount?: number | null | undefined
  requiredCount?: number | null | undefined
  hasLegacyDocumentUrl?: boolean
  now?: Date
}

export const isPpsType = (value: string) => value.toLowerCase().includes('pps')

export const getPpsAvailableDate = (eventDate: string | Date | null | undefined): Date | null => {
  if (!eventDate) return null
  const parsed = eventDate instanceof Date ? eventDate : new Date(eventDate)
  if (Number.isNaN(parsed.getTime())) return null

  const available = new Date(parsed)
  available.setMonth(available.getMonth() - 3)
  return available
}

export const isPpsUploadAllowed = (
  eventDate: string | Date | null | undefined,
  now: Date = new Date(),
) => {
  const availableDate = getPpsAvailableDate(eventDate)
  if (!availableDate) return true
  return now.getTime() >= availableDate.getTime()
}

export const computeDocumentAction = (params: ComputeDocumentActionParams) => {
  const now = params.now ?? new Date()

  if (!params.requiresDocument) {
    return {
      requiresAttention: false,
      isUpcoming: false,
      documentsComplete: true,
      missingOnlyPpsBeforeWindow: false,
    }
  }

  const eventDate = params.eventDate ? new Date(params.eventDate) : null
  const isUpcoming = eventDate ? eventDate >= now : false
  if (!isUpcoming) {
    return {
      requiresAttention: false,
      isUpcoming: false,
      documentsComplete: true,
      missingOnlyPpsBeforeWindow: false,
    }
  }

  const requiredTypes = Array.isArray(params.requiredTypes) ? params.requiredTypes : []
  const uploadedTypes = Array.isArray(params.uploadedTypes) ? params.uploadedTypes : []

  const requiredCount =
    typeof params.requiredCount === 'number'
      ? params.requiredCount
      : requiredTypes.length > 0
        ? requiredTypes.length
        : 1

  const uploadedCount =
    typeof params.uploadedCount === 'number'
      ? params.uploadedCount
      : uploadedTypes.length > 0
        ? uploadedTypes.length
        : params.hasLegacyDocumentUrl
          ? 1
          : 0

  const documentsComplete = requiredCount === 0 ? true : uploadedCount >= requiredCount
  const missingTypes =
    requiredTypes.length > 0 ? requiredTypes.filter((type) => !uploadedTypes.includes(type)) : []
  const ppsAllowed = isPpsUploadAllowed(eventDate, now)

  const missingOnlyPpsBeforeWindow =
    !documentsComplete &&
    missingTypes.length > 0 &&
    missingTypes.every((type) => isPpsType(type)) &&
    !ppsAllowed

  if (missingOnlyPpsBeforeWindow) {
    return {
      requiresAttention: false,
      isUpcoming,
      documentsComplete,
      missingOnlyPpsBeforeWindow: true,
    }
  }

  const requiresAttention =
    (!documentsComplete || params.approvalStatus !== 'approved')

  return {
    requiresAttention,
    isUpcoming,
    documentsComplete,
    missingOnlyPpsBeforeWindow: false,
  }
}
