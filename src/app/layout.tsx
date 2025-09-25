import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import uzMessages from '@/messages/uz.json'
import ruMessages from '@/messages/ru.json'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Car Expense Tracker',
  description: "Avtomobillar bo'yicha daromad va xarajatlarni yuritish uchun zamonaviy veb-ilova",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get locale from cookie or header, default to 'uz'
  const locale = cookies().get('locale')?.value ||
                 headers().get('x-locale') ||
                 'uz'

  // Use static imports for better reliability
  const messages = locale === 'ru' ? ruMessages : uzMessages

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
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
