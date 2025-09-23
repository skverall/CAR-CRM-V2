import * as React from 'react'

import { useToast } from '@/components/ui/use-toast'

type Options = {
  currency: string | undefined
  date: string | undefined
  onRate: (nextRate: number) => void
  enabled?: boolean
}

export function useFxRateAutoFill({ currency, date, onRate, enabled = true }: Options) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return

    const normalizedCurrency = currency?.trim().toUpperCase()
    if (!normalizedCurrency || normalizedCurrency.length !== 3) return
    if (!date) return

    if (normalizedCurrency === 'AED') {
      onRate(1)
      return
    }

    const controller = new AbortController()

    async function fetchRate() {
      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/fxrate?counter=${encodeURIComponent(normalizedCurrency)}&date=${encodeURIComponent(date)}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? 'Failed to resolve FX rate')
        }

        const payload = await response.json()
        if (!controller.signal.aborted) {
          const value = typeof payload.rate === 'number' ? payload.rate : Number(payload.rate)
          if (!Number.isFinite(value)) {
            throw new Error('FX rate response was invalid')
          }
          onRate(value)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Failed to resolve FX rate'
        toast({
          title: 'FX rate lookup failed',
          description: message,
          variant: 'destructive',
        })
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchRate()

    return () => {
      controller.abort()
    }
  }, [currency, date, enabled, onRate, toast])

  return { isLoading }
}

