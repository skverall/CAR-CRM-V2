import { ExpensePaidFrom, ExpenseType } from '@prisma/client'
import { z } from 'zod'

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
] as const satisfies readonly ExpenseType[]

const paidFrom = ['BUSINESS_FUNDS', 'INVESTOR_FUNDS', 'MY_PERSONAL'] as const satisfies readonly ExpensePaidFrom[]

export const expenseCreateSchema = z.object({
  carId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  type: z.enum(expenseTypes),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(3).max(3),
  fxRateToAed: z.coerce.number().positive(),
  date: z.string().min(1, 'Дата обязательна'),
  paidFrom: z.enum(paidFrom),
  description: z.string().max(2000).optional(),
  isPersonal: z.boolean().optional().default(false),
})

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
