'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { data } = useSession()
  const initials = data?.user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>{initials || 'AU'}</AvatarFallback>
          </Avatar>
          <span className='hidden text-sm font-medium lg:inline'>{data?.user?.name ?? 'User'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{data?.user?.name ?? 'Authenticated user'}</span>
            <span className='text-xs text-muted-foreground'>{data?.user?.role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/auth/sign-in' })}>Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
