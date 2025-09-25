import { setRequestLocale } from 'next-intl/server'
import { cookies } from 'next/headers'

export function getLocale() {
  return cookies().get('locale')?.value || 'uz'
}

export function enableStaticRendering() {
  const locale = getLocale()
  setRequestLocale(locale)
  return locale
}