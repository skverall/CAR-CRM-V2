'use client'

import { useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import uzMessages from '@/messages/uz.json'
import ruMessages from '@/messages/ru.json'

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: string
}

export function I18nProvider({ children, initialLocale = 'uz' }: I18nProviderProps) {
  const [locale, setLocale] = useState(initialLocale)
  const [messages, setMessages] = useState(initialLocale === 'ru' ? ruMessages : uzMessages)

  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(cookie => cookie.trim().startsWith('locale='))
      return localeCookie ? localeCookie.split('=')[1].trim() : 'uz'
    }

    // Set initial locale from cookie
    const cookieLocale = getLocaleFromCookie()
    if (cookieLocale !== locale) {
      setLocale(cookieLocale)
      setMessages(cookieLocale === 'ru' ? ruMessages : uzMessages)
    }

    // Listen for storage events (when cookie changes)
    const handleStorageChange = () => {
      const newLocale = getLocaleFromCookie()
      if (newLocale !== locale) {
        setLocale(newLocale)
        setMessages(newLocale === 'ru' ? ruMessages : uzMessages)
      }
    }

    // Listen for custom events (when LanguageSwitcher changes locale)
    window.addEventListener('localeChange', handleStorageChange)

    // Also check periodically as fallback
    const interval = setInterval(handleStorageChange, 2000)

    return () => {
      window.removeEventListener('localeChange', handleStorageChange)
      clearInterval(interval)
    }
  }, [locale])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
