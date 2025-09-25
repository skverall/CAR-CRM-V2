import { setRequestLocale } from 'next-intl/server'
<<<<<<< HEAD

export function enableStaticRendering(locale: string = 'uz') {
  setRequestLocale(locale)
  return locale
}
=======
import { cookies } from 'next/headers'

export function getLocale() {
  return cookies().get('locale')?.value || 'uz'
}

export function enableStaticRendering() {
  const locale = getLocale()
  setRequestLocale(locale)
  return locale
}
>>>>>>> 1eff706483c4f4be2e14c0d1141de853f17100d0
