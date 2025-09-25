import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Car Expense Tracker',
  description: "Avtomobillar bo'yicha daromad va xarajatlarni yuritish uchun zamonaviy veb-ilova",
}

// Generate static params for all locales
export function generateStaticParams() {
  return [{ locale: 'uz' }, { locale: 'ru' }]
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use static locale for static rendering
  const locale = 'uz'

  // Enable static rendering
  setRequestLocale(locale)

  // Load messages statically
  const messages = (await import(`@/messages/${locale}.json`)).default

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
