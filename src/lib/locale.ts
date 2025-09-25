import { setRequestLocale } from 'next-intl/server'

export function enableStaticRendering(locale: string = 'uz') {
 setRequestLocale(locale)
 return locale
}