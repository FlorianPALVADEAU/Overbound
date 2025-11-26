import * as Sentry from '@sentry/nextjs'

/**
 * Capture an exception and send it to Sentry
 * @param error - The error to capture
 * @param context - Additional context to send with the error
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional_context', context)
  }
  Sentry.captureException(error)
}

/**
 * Capture a message and send it to Sentry
 * @param message - The message to capture
 * @param level - The severity level
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 * @param user - User information
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb (activity log) to Sentry
 * @param message - Breadcrumb message
 * @param category - Category of the breadcrumb
 * @param level - Severity level
 */
export function addBreadcrumb(
  message: string,
  category = 'default',
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  })
}

export { Sentry }
