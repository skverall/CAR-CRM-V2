import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['uz', 'ru'],

  // Used when no locale matches
  defaultLocale: 'uz',

  // Don't use locale prefix for default locale
  localePrefix: 'never'
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(uz|ru)/:path*', '/((?!_next|_vercel|.*\\..*).*)']
}
