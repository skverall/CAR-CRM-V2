'use client'

import { CapitalTxnReason } from '@prisma/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import type { Resolver } from 'react-hook-form'
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
]

const formSchema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  amountAed: z.coerce.number().refine((value) => value !== 0, 'Amount cannot be zero'),
  date: z.string().min(1, 'Date is required'),
  reason: z.nativeEnum(CapitalTxnReason),
  note: z.string().optional(),
})

type AccountOption = {
  id: string
  name: string
  type: string
}

type Props = {
  accounts: AccountOption[]
}

type FormValues = z.infer<typeof formSchema>

const resolver: Resolver<FormValues> = zodResolver(formSchema) as unknown as Resolver<FormValues>

export function ManualTxnDialog({ accounts }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      amountAed: 0,
      date: new Date().toISOString().slice(0, 10),
      reason: CapitalTxnReason.ADJUST,
      note: '',
    },
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
        throw new Error(error.error ?? 'Failed to record transaction')
      }

      form.reset()
      setOpen(false)
      toast({ title: 'Transaction recorded' })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record transaction',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Manual transaction</Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Manual transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='accountId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select an account' />
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
              name='amountAed'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (AED)</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' {...field} />
                  </FormControl>
                  <FormDescription>Positive values add funds, negative values withdraw.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
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
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason.toLowerCase()}
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
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
