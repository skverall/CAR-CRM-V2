'use client'

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { MobileNav } from '@/components/navigation/sidebar'
import { ThemeToggle } from '@/components/navigation/theme-toggle'
import { UserMenu } from '@/components/navigation/user-menu'

export function Topbar() {
  return (
    <header className='flex h-16 items-center gap-3 border-b bg-background px-4 lg:px-6'>
      <MobileNav />
      <div className='flex flex-1 items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2'>
        <Search className='h-4 w-4 text-muted-foreground' />
        <Input className='h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0' placeholder='Search VIN, car, buyer' />
      </div>
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}

