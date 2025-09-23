'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const formSchema = z.object({
  carId: z.string().min(1, 'Выберите автомобиль'),
  accountId: z.string().optional(),
  amount: z.coerce.number().positive('Сумма должна быть больше 0'),
  currency: z.string().trim().min(3).max(3),
  fxRateToAed: z.coerce.number().positive('Курс должен быть больше 0'),
  date: z.string().min(1, 'Укажите дату'),
  buyerName: z.string().max(200).optional(),
  paymentMethod: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
})

export type IncomeFormValues = z.infer<typeof formSchema>

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

export function AddIncomeDialog({ accounts, cars, defaultCarId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carId: defaultCarId ?? cars[0]?.id ?? '',
      accountId: accounts.find((account) => account.type === 'BUSINESS')?.id ?? '',
      amount: 0,
      currency: 'AED',
      fxRateToAed: 1,
      date: new Date().toISOString().slice(0, 10),
      buyerName: '',
      paymentMethod: '',
      description: '',
    },
  })

  const onSubmit = async (values: IncomeFormValues) => {
    try {
      const payload = {
        ...values,
        currency: values.currency.trim().toUpperCase(),
        date: new Date(values.date),
      }

      const response = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'Не удалось сохранить доход')
      }

      form.reset()
      setOpen(false)
      router.refresh()
      toast({ title: 'Доход добавлен', description: 'Продажа зарегистрирована.' })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить доход',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Добавить доход</Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Новый доход</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='carId'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Автомобиль</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Выберите автомобиль' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name='buyerName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Покупатель</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='paymentMethod'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Метод оплаты</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='accountId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Счёт поступления</FormLabel>
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
