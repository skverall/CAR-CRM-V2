'use client'

import { useTranslations } from 'next-intl'

export default function TestI18nPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          i18n Test Page
        </h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Common:</h2>
            <p>App Title: {t('common.appTitle')}</p>
            <p>Loading: {t('common.loading')}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Auth:</h2>
            <p>Login Title: {t('auth.login.title')}</p>
            <p>Register Title: {t('auth.register.title')}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Navigation:</h2>
            <p>Dashboard: {t('nav.dashboard')}</p>
            <p>Cars: {t('nav.cars')}</p>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          This page tests basic i18n functionality
        </div>
      </div>
    </div>
  )
}
