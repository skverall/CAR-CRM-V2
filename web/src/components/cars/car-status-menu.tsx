'use client'

import { useMemo, useTransition } from 'react'
import { Loader2, MoveUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { CAR_STATUS_BADGE_VARIANT, CAR_STATUS_LABEL, CAR_STATUS_ORDER } from '@/constants/cars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'

interface Props {
  carId: string
  currentStatus: string
}

function canTransition(current: string, target: string) {
  if (current === target) return true
  const fromIndex = CAR_STATUS_ORDER.indexOf(current as typeof CAR_STATUS_ORDER[number])
  const toIndex = CAR_STATUS_ORDER.indexOf(target as typeof CAR_STATUS_ORDER[number])
  if (fromIndex === -1 || toIndex === -1) return false
  return toIndex >= fromIndex
}

export function CarStatusMenu({ carId, currentStatus }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const availableStatuses = useMemo(
    () =>
      CAR_STATUS_ORDER.map((status) => ({
        value: status,
        label: CAR_STATUS_LABEL[status],
        disabled: !canTransition(currentStatus, status),
      })),
    [currentStatus],
  )

  const currentLabel = CAR_STATUS_LABEL[currentStatus as keyof typeof CAR_STATUS_LABEL] ?? currentStatus

  const onSelect = (status: string) => {
    if (status === currentStatus) return

    startTransition(async () => {
      try {
        const response = await fetch(`/api/cars/${carId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error ?? 'Не удалось обновить статус')
        }

        toast({ title: 'Статус обновлён', description: `Текущий статус: ${CAR_STATUS_LABEL[status as keyof typeof CAR_STATUS_LABEL]}` })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Ошибка обновления статуса',
          description: error instanceof Error ? error.message : 'Не удалось обновить статус',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' disabled={isPending}>
          {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <MoveUpRight className='mr-2 h-4 w-4' />}
          Изменить статус
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel className='flex items-center justify-between'>
          <span>Текущий статус</span>
          <Badge variant={CAR_STATUS_BADGE_VARIANT[currentStatus as keyof typeof CAR_STATUS_BADGE_VARIANT] ?? 'outline'}>
            {currentLabel}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStatuses.map((status) => (
          <DropdownMenuItem
            key={status.value}
            disabled={status.disabled}
            onSelect={() => onSelect(status.value)}
            className='flex items-center justify-between gap-2'
          >
            <span>{status.label}</span>
            {status.value === currentStatus ? <Badge variant='outline'>текущий</Badge> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

