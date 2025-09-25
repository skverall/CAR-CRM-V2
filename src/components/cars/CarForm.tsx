'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Car, CarStatus } from '@/types'
import { useCreateCar, useUpdateCar } from '@/hooks/useCars'
import { validateVIN } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {useTranslations} from 'next-intl'

const makeSchema = (t: any) => z.object({
  vin: z.string()
    .length(17, t('cars.form.validation.vinLength'))
    .refine(validateVIN, t('cars.form.validation.vinInvalid')),
  brand: z.string().min(1, t('cars.form.validation.brandRequired')),
  model: z.string().min(1, t('cars.form.validation.modelRequired')),
  year: z.number()
    .min(1900, t('cars.form.validation.yearMin'))
    .max(new Date().getFullYear() + 1, t('cars.form.validation.yearMax')),
  status: z.enum(['active', 'sold'] as const).optional(),
  purchasePrice: z.number().positive(t('cars.form.validation.pricePositive')).optional(),
  purchaseDate: z.string().optional(),
  salePrice: z.number().positive(t('cars.form.validation.pricePositive')).optional(),
  saleDate: z.string().optional(),
})

type CarFormData = z.infer<ReturnType<typeof makeSchema>>

interface CarFormProps {
  car?: Car
  onSuccess?: () => void
  onCancel?: () => void
}

export function CarForm({ car, onSuccess, onCancel }: CarFormProps) {
  const [error, setError] = useState<string | null>(null)
  const createCarMutation = useCreateCar()
  const updateCarMutation = useUpdateCar()

  const isEditing = !!car
  const isLoading = createCarMutation.isPending || updateCarMutation.isPending
const t = useTranslations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CarFormData>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: car ? {
      vin: car.vin,
      brand: car.brand,
      model: car.model,
      year: car.year,
      status: car.status,
      purchasePrice: car.purchase_price || undefined,
      purchaseDate: car.purchase_date || undefined,
      salePrice: car.sale_price || undefined,
      saleDate: car.sale_date || undefined,
    } : {
      status: 'active',
    },
  })

  const watchedStatus = watch('status')

  const onSubmit = async (data: CarFormData) => {
    setError(null)

    try {
      if (isEditing && car) {
        await updateCarMutation.mutateAsync({
          id: car.id,
          data: {
            vin: data.vin,
            brand: data.brand,
            model: data.model,
            year: data.year,
            status: data.status,
            purchasePrice: data.purchasePrice,
            purchaseDate: data.purchaseDate,
            salePrice: data.salePrice,
            saleDate: data.saleDate,
          },
        })
      } else {
        await createCarMutation.mutateAsync({
          vin: data.vin,
          brand: data.brand,
          model: data.model,
          year: data.year,
          purchasePrice: data.purchasePrice,
          purchaseDate: data.purchaseDate,
        })
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorGeneric'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">{t('cars.form.fields.vin')}</Label>
          <Input
            id="vin"
            placeholder="1HGBH41JXMN109186"
            {...register('vin')}
            disabled={isLoading}
            className="uppercase"
          />
          {errors.vin && (
            <p className="text-sm text-red-600">{errors.vin.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">{t('cars.form.fields.brand')}</Label>
          <Input
            id="brand"
            placeholder="Toyota"
            {...register('brand')}
            disabled={isLoading}
          />
          {errors.brand && (
            <p className="text-sm text-red-600">{errors.brand.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">{t('cars.form.fields.model')}</Label>
          <Input
            id="model"
            placeholder="Camry"
            {...register('model')}
            disabled={isLoading}
          />
          {errors.model && (
            <p className="text-sm text-red-600">{errors.model.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">{t('cars.form.fields.year')}</Label>
          <Input
            id="year"
            type="number"
            placeholder="2020"
            {...register('year', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.year && (
            <p className="text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>

        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="status">{t('cars.form.fields.status')}</Label>
            <Select 
              onValueChange={(value) => setValue('status', value as CarStatus)} 
              defaultValue={car?.status}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('cars.form.status.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('cars.statusLabel.active')}</SelectItem>
                <SelectItem value="sold">{t('cars.statusLabel.sold')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">{t('cars.form.fields.purchasePrice')}</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            placeholder="25000"
            {...register('purchasePrice', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.purchasePrice && (
            <p className="text-sm text-red-600">{errors.purchasePrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">{t('cars.form.fields.purchaseDate')}</Label>
          <Input
            id="purchaseDate"
            type="date"
            {...register('purchaseDate')}
            disabled={isLoading}
          />
          {errors.purchaseDate && (
            <p className="text-sm text-red-600">{errors.purchaseDate.message}</p>
          )}
        </div>

        {watchedStatus === 'sold' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="salePrice">{t('cars.form.fields.salePrice')}</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                placeholder="30000"
                {...register('salePrice', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.salePrice && (
                <p className="text-sm text-red-600">{errors.salePrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">{t('cars.form.fields.saleDate')}</Label>
              <Input
                id="saleDate"
                type="date"
                {...register('saleDate')}
                disabled={isLoading}
              />
              {errors.saleDate && (
                <p className="text-sm text-red-600">{errors.saleDate.message}</p>
              )}
            </div>
          </>
        )}
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
