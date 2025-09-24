import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/providers/QueryProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Car Expense Tracker',
  description: 'Современное веб-приложение для учёта расходов и доходов по автомобилям',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
