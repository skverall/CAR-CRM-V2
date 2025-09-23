'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export function AppProviders({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
