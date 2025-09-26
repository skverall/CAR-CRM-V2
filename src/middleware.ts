import { NextResponse, type NextRequest } from 'next/server'

// Temporarily disable i18n routing to fix 404s
export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

// Disable matching so this middleware is effectively a no-op
export const config = {
  matcher: []
}
