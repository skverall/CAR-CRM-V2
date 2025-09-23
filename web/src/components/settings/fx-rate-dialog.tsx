'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

const formSchema = z.object({
  date: z.string().min(1, 'Укажите дату'),
  counter: z.string().trim().min(3).max(3),
  rate: z.coerce.number().positive('Курс должен быть больше 0'),
})

type FxFormValues = z.infer<typeof formSchema>

export function FxRateDialog() {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)

  const form = useForm<FxFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      counter: '',
      rate: 0,
    },
  })

  const onSubmit = async (values: FxFormValues) => {
    try {
      const response = await fetch('/api/fxrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          counter: values.counter.trim().toUpperCase(),
          date: new Date(values.date),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'Не удалось сохранить курс')
      }

      form.reset({ date: new Date().toISOString().slice(0, 10), counter: '', rate: 0 })
      setOpen(false)
      toast({ title: 'Курс сохранён' })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить курс',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Добавить курс</Button>
      </DialogTrigger>
      <DialogContent className='w-full max-w-md'>
        <DialogHeader>
          <DialogTitle>Новый курс валюты</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
              name='counter'
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
              name='rate'
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
