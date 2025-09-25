'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  Car, 
  Receipt, 
  BarChart3, 
  Settings, 
  User,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {useTranslations} from 'next-intl'
import { LanguageSwitcher } from './LanguageSwitcher'

const navigation = [
  { nameKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { nameKey: 'nav.cars', href: '/cars', icon: Car },
  { nameKey: 'nav.transactions', href: '/transactions', icon: Receipt },
  { nameKey: 'nav.reports', href: '/reports', icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()
  const t = useTranslations()
  const { user, profile, signOut } = useAuth()

  if (!user || !profile) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return t('roles.owner')
      case 'investor':
        return t('roles.investor')
      case 'assistant':
        return t('roles.assistant')
      default:
        return role
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              {t('common.appTitle')}
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(item.nameKey as any)}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block">
                    {profile.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.full_name || user.email}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(profile.role)}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('profile.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(item.nameKey as any)}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
