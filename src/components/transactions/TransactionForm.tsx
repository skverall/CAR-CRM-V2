'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TransactionWithCar, TransactionType, TRANSACTION_CATEGORIES, CURRENCIES } from '@/types'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useCars } from '@/hooks/useCars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {useTranslations} from 'next-intl'

const makeSchema = (t: any) => z.object({
  type: z.enum(['income', 'expense'] as const),
  category: z.string().min(1, t('transactions.form.validation.categoryRequired')),
  amount: z.number().positive(t('transactions.form.validation.amountPositive')),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  date: z.string(),
  carId: z.string().optional(),
  isPersonal: z.boolean().default(false),
})

type TransactionFormData = z.infer<ReturnType<typeof makeSchema>>

interface TransactionFormProps {
  transaction?: TransactionWithCar
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [error, setError] = useState<string | null>(null)
  const createTransactionMutation = useCreateTransaction()
  const updateTransactionMutation = useUpdateTransaction()
  const { data: carsData } = useCars({ limit: 100 })

  const isEditing = !!transaction
  const isLoading = createTransactionMutation.isPending || updateTransactionMutation.isPending
const t = useTranslations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: transaction ? {
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description || undefined,
      date: transaction.date,
      carId: transaction.car_id || undefined,
      isPersonal: transaction.is_personal,
    } : {
      type: 'expense',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      isPersonal: false,
    },
  })

  const watchedType = watch('type')
  const watchedIsPersonal = watch('isPersonal')

  const onSubmit = async (data: TransactionFormData) => {
    setError(null)

    try {
      if (isEditing && transaction) {
        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          data: {
            type: data.type,
            category: data.category,
            amount: data.amount,
            currency: data.currency,
            description: data.description,
            date: data.date,
            carId: data.carId,
            isPersonal: data.isPersonal,
          },
        })
      } else {
        await createTransactionMutation.mutateAsync({
          type: data.type,
          category: data.category,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          date: data.date,
          carId: data.carId,
          isPersonal: data.isPersonal,
        })
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorGeneric'))
    }
  }

  const availableCategories = TRANSACTION_CATEGORIES[watchedType] || []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">{t('transactions.form.fields.type')}</Label>
          <Select 
            onValueChange={(value) => setValue('type', value as TransactionType)} 
            defaultValue={transaction?.type || 'expense'}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.form.placeholders.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">{t('transactions.filter.type.income')}</SelectItem>
              <SelectItem value="expense">{t('transactions.filter.type.expense')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('transactions.form.fields.category')}</Label>
          <Select 
            onValueChange={(value) => setValue('category', value)} 
            defaultValue={transaction?.category}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.form.placeholders.category')} />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">{t('transactions.form.fields.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="1000"
            {...register('amount', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">{t('transactions.form.fields.currency')}</Label>
          <Select 
            onValueChange={(value) => setValue('currency', value)} 
            defaultValue={transaction?.currency || 'USD'}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.form.placeholders.currency')} />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-sm text-red-600">{errors.currency.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">{t('transactions.form.fields.date')}</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            disabled={isLoading}
          />
          {errors.date && (
            <p className="text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {!watchedIsPersonal && (
          <div className="space-y-2">
            <Label htmlFor="carId">{t('transactions.form.fields.car')}</Label>
            <Select 
              onValueChange={(value) => setValue('carId', value === 'none' ? undefined : value)} 
              defaultValue={transaction?.car_id || 'none'}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.form.placeholders.car')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('transactions.form.generalExpenses')}</SelectItem>
                {carsData?.cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.vin})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carId && (
              <p className="text-sm text-red-600">{errors.carId.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('transactions.form.fields.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('transactions.form.placeholders.description')}
          {...register('description')}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPersonal"
          checked={watchedIsPersonal}
          onCheckedChange={(checked) => setValue('isPersonal', !!checked)}
          disabled={isLoading}
        />
        <Label htmlFor="isPersonal">{t('transactions.form.fields.isPersonal')}</Label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  )
}
