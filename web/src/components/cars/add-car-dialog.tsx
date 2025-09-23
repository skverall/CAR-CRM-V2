'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{11,17}$/

const formSchema = z.object({
  vin: z
    .string()
    .trim()
    .regex(VIN_REGEX, 'VIN must be 11-17 characters, uppercase, without I/O/Q'),
  make: z.string().min(1, 'Укажите марку').max(60),
  model: z.string().min(1, 'Укажите модель').max(60),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  buyDate: z.string().min(1, 'Укажите дату покупки'),
  buyPrice: z.coerce.number().positive('Сумма должна быть больше 0'),
  buyCurrency: z
    .string()
    .trim()
    .min(3, 'ISO код из 3 символов')
    .max(3, 'ISO код из 3 символов'),
  buyRate: z.coerce.number().positive('Курс должен быть больше 0'),
  source: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  fundingAccountId: z.string().optional(),
})

export type CarFormValues = z.infer<typeof formSchema>

type AccountOption = {
  id: string
  name: string
  type: string
}

type Props = {
  accounts: AccountOption[]
}

export function AddCarDialog({ accounts }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)

  const form = useForm<CarFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      buyDate: new Date().toISOString().slice(0, 10),
      buyPrice: 0,
      buyCurrency: 'USD',
      buyRate: 3.6725,
      source: '',
      notes: '',
      fundingAccountId: accounts.find((account) => account.type === 'BUSINESS')?.id ?? '',
    },
  })

  const onSubmit = async (values: CarFormValues) => {
    try {
      const payload = {
        ...values,
        vin: values.vin.trim().toUpperCase(),
        buyCurrency: values.buyCurrency.trim().toUpperCase(),
        buyDate: new Date(values.buyDate),
      }

      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'Не удалось создать авто')
      }

      form.reset()
      setOpen(false)
      router.refresh()
      toast({ title: 'Автомобиль создан', description: `${values.make} ${values.model} добавлен в список.` })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать авто',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить авто</Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Новое авто</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='vin'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder='KMHXX81BAGU123456' {...field} className='uppercase' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='make'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Марка</FormLabel>
                  <FormControl>
                    <Input placeholder='Hyundai' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='model'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Модель</FormLabel>
                  <FormControl>
                    <Input placeholder='Sonata' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='year'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Год</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='buyDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата покупки</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='buyPrice'
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
              name='buyCurrency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валюта</FormLabel>
                  <FormControl>
                    <Input placeholder='USD' className='uppercase' maxLength={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='buyRate'
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
              name='fundingAccountId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Финансирование</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormDescription>Счёт, с которого оплачена покупка.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='source'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Источник</FormLabel>
                  <FormControl>
                    <Input placeholder='Корея, дилер, аукцион…' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='md:col-span-2 flex justify-end gap-2'>
              <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Сохранить
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
