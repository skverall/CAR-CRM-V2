"use client"

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const setLocale = (nextLocale: 'uz' | 'ru') => {
    if (nextLocale === locale) return
    document.cookie = `locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}`

    // Dispatch custom event to notify I18nProvider
    window.dispatchEvent(new CustomEvent('localeChange'))

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2 mr-3">
      <Button
        type="button"
        variant={locale === 'uz' ? 'default' : 'secondary'}
        size="sm"
        disabled={isPending}
        onClick={() => setLocale('uz')}
      >
        UZ
      </Button>
      <Button
        type="button"
        variant={locale === 'ru' ? 'default' : 'secondary'}
        size="sm"
        disabled={isPending}
        onClick={() => setLocale('ru')}
      >
        RU
      </Button>
    </div>
  )
}

