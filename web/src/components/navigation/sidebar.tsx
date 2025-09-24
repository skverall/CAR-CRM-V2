'use client'

import * as React from 'react'
import { Car, Coins, FileChartColumn, Gauge, Layers, Settings, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const navItems = [
  { title: 'Dashboard', href: '/', icon: Gauge },
  { title: 'Cars', href: '/cars', icon: Car },
  { title: 'Expenses', href: '/expenses', icon: Coins },
  { title: 'Incomes', href: '/incomes', icon: Wallet },
  { title: 'Capital', href: '/capital', icon: Layers },
  { title: 'Reports', href: '/reports', icon: FileChartColumn },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className='hidden w-64 shrink-0 border-r bg-muted/40 lg:flex lg:flex-col'>
      <div className='flex h-16 items-center border-b px-6 text-lg font-semibold'>Авто-Учёт</div>
      <nav className='flex-1 space-y-1 p-4'>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground',
              )}
            >
              <Icon className='h-4 w-4' />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className='inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium lg:hidden'>
        Menu
      </DialogTrigger>
      <DialogContent className='w-full max-w-xs p-0 sm:max-w-xs'>
        <nav className='grid gap-1 p-4'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground',
                )}
              >
                <Icon className='h-4 w-4' />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </DialogContent>
    </Dialog>
  )
}
