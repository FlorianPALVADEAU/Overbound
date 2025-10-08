import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

type LoggedMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const LOGGED_METHODS: LoggedMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE']
const MAX_BODY_LENGTH = 8_192

const sanitizeBody = async (request: NextRequest | Request | null) => {
  if (!request) return null
  try {
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      return body
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      return Object.fromEntries(formData.entries())
    }
    if (contentType.includes('text/')) {
      const text = await request.text()
      return text.length > MAX_BODY_LENGTH ? `${text.slice(0, MAX_BODY_LENGTH)}…` : text
    }
    return '[non-loggable-body]'
  } catch {
    return null
  }
}

const truncateJson = (value: unknown) => {
  try {
    const serialized = JSON.stringify(value)
    if (!serialized) return null
    if (serialized.length <= MAX_BODY_LENGTH) return JSON.parse(serialized)
    const truncated = serialized.slice(0, MAX_BODY_LENGTH)
    return `${truncated}…`
  } catch {
    return null
  }
}

interface SummaryContext {
  method: string
  path: string
  statusCode: number
  userEmail?: string | null
  actionType?: string | null
}

export type SummaryBuilder = (context: SummaryContext) => string

const defaultSummaryBuilder: SummaryBuilder = ({
  method,
  path,
  statusCode,
  userEmail,
  actionType,
}) => {
  const actor = userEmail ?? 'Utilisateur inconnu'
  const normalizedPath = path.replace(/\/api\//, '')
  if (actionType) {
    return `${actor} a exécuté ${actionType} (${method} ${normalizedPath}) → ${statusCode}`
  }
  return `${actor} a appelé ${method} ${normalizedPath} → ${statusCode}`
}

interface LogAdminRequestOptions {
  actionType?: string
  summaryBuilder?: SummaryBuilder
  metadata?: Record<string, unknown>
  requestBody?: unknown
}

const logAdminRequest = async ({
  request,
  response,
  error,
  durationMs,
  options,
}: {
  request: NextRequest
  response?: NextResponse
  error?: unknown
  durationMs: number
  options?: LogAdminRequestOptions
}) => {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = supabaseAdmin()
    const url = request.nextUrl
    const method = request.method.toUpperCase()
    const queryObject = Object.fromEntries(url.searchParams.entries())
    const summaryBuilder = options?.summaryBuilder ?? defaultSummaryBuilder
    const statusCode = response ? response.status : error ? 500 : 200
    const summary = summaryBuilder({
      method,
      path: url.pathname,
      statusCode,
      userEmail: user?.email,
      actionType: options?.actionType ?? null,
    })

    await admin.from('admin_request_logs').insert({
      method,
      path: url.pathname,
      query_params: Object.keys(queryObject).length > 0 ? queryObject : null,
      body: truncateJson(options?.requestBody),
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      status_code: statusCode,
      duration_ms: Math.round(durationMs),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      action_type: options?.actionType ?? null,
      summary,
      metadata: options?.metadata ?? null,
      error_message:
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : null,
    })
  } catch (logError) {
    console.error('[admin-logging] Unable to persist log entry', logError)
  }
}

interface WithLoggingOptions extends LogAdminRequestOptions {
  methods?: LoggedMethod[]
}

export function withRequestLogging<Handler extends (...args: any[]) => Promise<any>>(
  handler: Handler,
  options?: WithLoggingOptions,
) {
  return (async (...args: Parameters<Handler>) => {
    const request = args[0] as NextRequest
    const method = request.method.toUpperCase() as LoggedMethod
    const methodsToLog = options?.methods ?? LOGGED_METHODS
    const shouldLog = methodsToLog.includes(method)
    const clonedRequest = shouldLog ? request.clone() : null
    const start = performance.now()
    let response: any
    let caughtError: unknown | undefined

    try {
      response = await handler(...args)
    } catch (error) {
      caughtError = error
      throw error
    } finally {
      if (shouldLog && clonedRequest) {
        const requestBody = await sanitizeBody(clonedRequest)
        await logAdminRequest({
          request,
          response: response instanceof NextResponse ? response : undefined,
          error: caughtError,
          durationMs: performance.now() - start,
          options: {
            ...options,
            requestBody,
          },
        })
      }
    }
    return response
  }) as Handler
}
