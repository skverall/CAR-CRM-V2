'use client'

import { CapitalTxnReason } from '@prisma/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const reasonOptions = [
  CapitalTxnReason.DEPOSIT_INVESTOR,
  CapitalTxnReason.WITHDRAW_OWNER,
  CapitalTxnReason.ADJUST,
  CapitalTxnReason.OTHER,
] as const

const formSchema = z.object({
  accountId: z.string().min(1, 'Выберите счёт'),
  amountAed: z.coerce.number().refine((value) => value !== 0, 'Сумма не может быть 0'),
  date: z.string().min(1, 'Дата обязательна'),
  reason: z.nativeEnum(CapitalTxnReason),
  note: z.string().optional(),
})

type AccountOption = {
  id: string
  name: string
  type: string
}

type FormValues = z.infer<typeof formSchema>

type Props = {
  accounts: AccountOption[]
  trigger?: ReactNode
  triggerLabel?: string
  triggerVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
  reason?: CapitalTxnReason
  lockReason?: boolean
  defaultAmountAed?: number
  dialogTitle?: string
  description?: string
  successMessage?: string
}

export function ManualTxnDialog({
  accounts,
  trigger,
  triggerLabel = 'Manual transaction',
  triggerVariant = 'outline',
  reason = CapitalTxnReason.ADJUST,
  lockReason = false,
  defaultAmountAed = 0,
  dialogTitle = 'Manual transaction',
  description,
  successMessage = 'Transaction recorded',
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const defaultValues: FormValues = {
    accountId: accounts[0]?.id ?? '',
    amountAed: defaultAmountAed,
    date: new Date().toISOString().slice(0, 10),
    reason,
    note: '',
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/capital/txn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, date: new Date(values.date) }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'Не удалось записать операцию')
      }

      form.reset({ ...defaultValues, reason })
      setOpen(false)
      toast({ title: successMessage })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось записать операцию',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={triggerVariant} size='sm'>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='accountId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Выберите счёт' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} · {account.type.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amountAed'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма (AED)</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' {...field} />
                  </FormControl>
                  <FormDescription>Положительное значение пополняет счёт, отрицательное — списывает.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Основание</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={lockReason}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
