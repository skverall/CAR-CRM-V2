import { z } from 'zod'

export const fxRateUpsertSchema = z.object({
  date: z.string().min(1, 'Дата обязательна'),
  counter: z.string().trim().min(3).max(3),
  rate: z.coerce.number().positive('Курс должен быть больше 0'),
})

export type FxRateUpsertInput = z.infer<typeof fxRateUpsertSchema>
