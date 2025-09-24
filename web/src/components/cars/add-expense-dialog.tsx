'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useFxRateAutoFill } from '@/hooks/use-fx-rate'

const expenseTypes = [
  'FUEL',
  'REPAIR',
  'DOCS',
  'SHIPPING',
  'CUSTOMS',
  'INSURANCE',
  'LISTING',
  'TRANSPORT',
  'OTHER',
] as const

const paidFromOptions = ['BUSINESS_FUNDS', 'INVESTOR_FUNDS', 'MY_PERSONAL'] as const

const formSchema = z.object({
  carId: z.string().optional(),
  accountId: z.string().optional(),
  type: z.enum(expenseTypes),
  amount: z.coerce.number().positive('Сумма должна быть больше 0'),
  currency: z.string().trim().min(3).max(3),
  fxRateToAed: z.coerce.number().positive('Курс должен быть больше 0'),
  date: z.string().min(1, 'Укажите дату'),
  paidFrom: z.enum(paidFromOptions),
  description: z.string().max(2000).optional(),
  isPersonal: z.boolean().optional().default(false),
})

export type ExpenseFormValues = z.infer<typeof formSchema>

type AccountOption = {
  id: string
  name: string
  type: string
}

type CarOption = {
  id: string
  label: string
}

type Props = {
  accounts: AccountOption[]
  cars: CarOption[]
  defaultCarId?: string
}

export function AddExpenseDialog({ accounts, cars, defaultCarId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carId: defaultCarId ?? '',
      accountId: accounts.find((account) => account.type === 'BUSINESS')?.id ?? '',
      type: 'OTHER',
      amount: 0,
      currency: 'AED',
      fxRateToAed: 1,
      date: new Date().toISOString().slice(0, 10),
      description: '',
      paidFrom: 'BUSINESS_FUNDS',
      isPersonal: false,
    },
  })

  const currency = form.watch('currency')
  const date = form.watch('date')

  const handleFxRate = React.useCallback(
    (nextRate: number) => {
      form.setValue('fxRateToAed', Number(nextRate.toFixed(6)), {
        shouldDirty: false,
        shouldValidate: true,
      })
    },
    [form],
  )

  const { isLoading: isFxLoading } = useFxRateAutoFill({
    currency,
    date,
    onRate: handleFxRate,
  })

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const payload = {
        ...values,
        currency: values.currency.trim().toUpperCase(),
        date: new Date(values.date),
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'Не удалось сохранить расход')
      }

      form.reset()
      setOpen(false)
      router.refresh()
      toast({ title: 'Расход добавлен', description: 'Операция успешно создана.' })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить расход',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Добавить расход</Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='carId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Автомобиль</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Без привязки' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value=''>Общий расход</SelectItem>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.label}
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
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseTypes.map((option) => (
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
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта</FormLabel>
                  <FormControl>
                    <Input className='uppercase' maxLength={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='fxRateToAed'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Курс к AED</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.0001' {...field} />
                  </FormControl>
                  <FormDescription>
                    {isFxLoading ? 'Подбираем курс...' : 'Подставляется автоматически по справочнику FX.'}
                  </FormDescription>
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
              name='paidFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Источник оплаты</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='BUSINESS_FUNDS'>Бизнес</SelectItem>
                      <SelectItem value='INVESTOR_FUNDS'>Инвестор</SelectItem>
                      <SelectItem value='MY_PERSONAL'>Личные</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='accountId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт списания</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Выберите счёт' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.type.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Счёт, с которого списываем деньги.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='md:col-span-2'>
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
