import type { NextRequest } from 'next/server'
import { middleware as authMiddleware } from './src/middlewares/authMiddleware'

export function middleware(request: NextRequest) {
  return authMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
