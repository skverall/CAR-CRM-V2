import { CapitalTxnReason } from '@prisma/client'
import { z } from 'zod'

const reasons = [
  'BUY_CAR',
  'EXPENSE_CAR',
  'EXPENSE_GENERAL',
  'INCOME_SALE',
  'PAYOUT_OWNER',
  'PAYOUT_ASSISTANT',
  'PAYOUT_INVESTOR',
  'DEPOSIT_INVESTOR',
  'WITHDRAW_OWNER',
  'ADJUST',
  'OTHER',
] as const satisfies readonly CapitalTxnReason[]

export const capitalTxnCreateSchema = z.object({
  accountId: z.string().min(1, 'Выберите счёт'),
  amountAed: z.coerce.number().refine((value) => value !== 0, 'Сумма не может быть 0'),
  date: z.string().min(1, 'Дата обязательна'),
  reason: z.enum(reasons),
  carId: z.string().optional(),
  expenseId: z.string().optional(),
  incomeId: z.string().optional(),
  note: z.string().max(2000).optional(),
})

export type CapitalTxnCreateInput = z.infer<typeof capitalTxnCreateSchema>
