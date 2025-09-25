import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Get locale from cookie or default to 'uz'
  const locale = request.cookies.get('locale')?.value || 'uz'
  
  // Add locale to request headers for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
}
