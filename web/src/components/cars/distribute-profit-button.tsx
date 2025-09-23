'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

type Props = {
  carId: string
  profit: number
}

export function DistributeProfitButton({ carId, profit }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const distribute = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cars/${carId}/distribute-profit`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? '�� ������� ������������ �������')
      }
      toast({ title: '������� ������������' })
      router.refresh()
    } catch (error) {
      toast({
        title: '������',
        description: error instanceof Error ? error.message : '�� ������� ������������ �������',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant='outline' disabled={profit <= 0 || isLoading} onClick={distribute}>
      {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
      ������������ �������
    </Button>
  )
}
