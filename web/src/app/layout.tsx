import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { AppProviders } from '@/components/providers'
import { Topbar } from '@/components/navigation/topbar'
import { Sidebar } from '@/components/navigation/sidebar'
import { getCurrentSession } from '@/lib/auth'
import { cn } from '@/lib/utils'
import './globals.css'

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Авто-Учёт',
  description: 'CRM‑система для учёта автомобилей, расходов, доходов и распределения капитала.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()

  return (
    <html lang='ru' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <AppProviders session={session}>
          <div className='flex min-h-screen w-full bg-background text-foreground'>
            <Sidebar />
            <div className='flex flex-1 flex-col'>
              <Topbar />
              <main className='flex-1 space-y-6 p-4 md:p-6'>{children}</main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  )
}
