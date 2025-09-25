import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['uz', 'ru']

export default getRequestConfig(async ({ requestLocale }) => {
  // For static rendering, always use default locale
  const locale = 'uz'

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
