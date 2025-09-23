import { z } from 'zod'

export const incomeCreateSchema = z.object({
  carId: z.string().min(1, 'Выберите автомобиль'),
  accountId: z.string().min(1).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(3).max(3),
  fxRateToAed: z.coerce.number().positive(),
  date: z.string().min(1, 'Дата обязательна'),
  buyerName: z.string().max(200).optional(),
  paymentMethod: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
})

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>
