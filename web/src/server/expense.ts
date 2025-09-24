import { Prisma, CapitalAccountType, CapitalTxnReason, ExpensePaidFrom, UserRole } from '@prisma/client'

import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { SessionUser } from '@/lib/auth'
import { expenseCreateSchema } from '@/lib/validators/expenses'

const roleCanCreateExpenses = new Set<UserRole>([UserRole.OWNER, UserRole.ASSISTANT])

const decimal = (value: number | string) => new Prisma.Decimal(value)
const negate = (value: Prisma.Decimal) => value.mul(-1)

async function resolveAccount(
  payload: {
    accountId?: string
    paidFrom: ExpensePaidFrom
    carId?: string
  },
) {
  if (payload.accountId) {
    const account = await prisma.capitalAccount.findUnique({ where: { id: payload.accountId } })
    if (!account) {
      throw new AppError('Счёт не найден', { status: 400 })
    }
    return account
  }

  if (payload.paidFrom === ExpensePaidFrom.BUSINESS_FUNDS) {
    const account = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.BUSINESS } })
    if (!account) {
      throw new AppError('Не найден бизнес-счёт', { status: 400 })
    }
    return account
  }

  if (payload.paidFrom === ExpensePaidFrom.MY_PERSONAL) {
    const account = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.OWNER } })
    if (!account) {
      throw new AppError('Не найден личный счёт владельца', { status: 400 })
    }
    return account
  }

  if (payload.paidFrom === ExpensePaidFrom.INVESTOR_FUNDS) {
    if (payload.carId) {
      const buyTxn = await prisma.capitalTxn.findFirst({
        where: {
          carId: payload.carId,
          reason: CapitalTxnReason.BUY_CAR,
        },
      })
      if (buyTxn) {
        const investorAccount = await prisma.capitalAccount.findUnique({ where: { id: buyTxn.accountId } })
        if (investorAccount) return investorAccount
      }
    }

    const account = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.INVESTOR } })
    if (!account) {
      throw new AppError('Не найден счёт инвестора', { status: 400 })
    }
    return account
  }

  throw new AppError('Не удалось определить счёт для операции', { status: 400 })
}

export async function createExpense(payload: unknown, user: SessionUser) {
  if (!roleCanCreateExpenses.has(user.role)) {
    throw new AppError('Недостаточно прав для создания расхода', { status: 403 })
  }

  const data = expenseCreateSchema.parse(payload)
  const account = await resolveAccount({
    accountId: data.accountId,
    paidFrom: data.paidFrom,
    carId: data.carId,
  })

  const amount = decimal(data.amount)
  const fxRate = decimal(data.fxRateToAed)
  const amountAed = amount.mul(fxRate)

  const reason = data.carId && !data.isPersonal
    ? CapitalTxnReason.EXPENSE_CAR
    : CapitalTxnReason.EXPENSE_GENERAL

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        carId: data.carId ?? null,
        type: data.type,
        amount,
        currency: data.currency,
        fxRateToAed: fxRate,
        date: data.date,
        paidFrom: data.paidFrom,
        description: data.description,
        isPersonal: data.isPersonal ?? false,
      },
    })

    await tx.capitalTxn.create({
      data: {
        accountId: account.id,
        amountAed: negate(amountAed),
        date: data.date,
        reason,
        carId: data.carId ?? null,
        expenseId: created.id,
        meta: {
          currency: data.currency,
          amount: amount.toString(),
          fxRateToAed: fxRate.toString(),
        },
      },
    })

    return created
  })

  return expense
}

export async function listExpenses(limit = 100) {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      car: {
        select: { id: true, vin: true, make: true, model: true, year: true },
      },
    },
  })

  return expenses.map((expense) => ({
    id: expense.id,
    car: expense.car
      ? {
          id: expense.car.id,
          vin: expense.car.vin,
          make: expense.car.make,
          model: expense.car.model,
          year: expense.car.year,
        }
      : null,
    type: expense.type,
    amount: expense.amount.toNumber(),
    currency: expense.currency,
    fxRateToAed: expense.fxRateToAed.toNumber(),
    amountAed: expense.amount.mul(expense.fxRateToAed).toNumber(),
    date: expense.date.toISOString(),
    description: expense.description,
    paidFrom: expense.paidFrom,
    isPersonal: expense.isPersonal,
    createdAt: expense.createdAt.toISOString(),
  }))
}
