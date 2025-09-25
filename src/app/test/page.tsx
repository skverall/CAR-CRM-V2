"use client"

import {useTranslations} from 'next-intl'

export default function TestPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">{t('test.title')}</h1>
        <p className="text-gray-600">{t('test.deployed')}</p>
        <div className="mt-4 space-y-2">
          <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</p>
          <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  )
}
