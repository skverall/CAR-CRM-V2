import { Prisma, CapitalAccountType, CapitalTxnReason, UserRole } from '@prisma/client'

import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { SessionUser } from '@/lib/auth'
import { incomeCreateSchema } from '@/lib/validators/incomes'

const decimal = (value: number | string) => new Prisma.Decimal(value)

const roleCanCreateIncome = new Set<UserRole>([UserRole.OWNER, UserRole.ASSISTANT])

async function resolveAccount(accountId?: string) {
  if (accountId) {
    const account = await prisma.capitalAccount.findUnique({ where: { id: accountId } })
    if (!account) {
      throw new AppError('Счёт не найден', { status: 400 })
    }
    return account
  }

  const business = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.BUSINESS } })
  if (!business) {
    throw new AppError('Не найден бизнес-счёт для зачисления дохода', { status: 400 })
  }
  return business
}

export async function createIncome(payload: unknown, user: SessionUser) {
  if (!roleCanCreateIncome.has(user.role)) {
    throw new AppError('Недостаточно прав для создания дохода', { status: 403 })
  }

  const data = incomeCreateSchema.parse(payload)
  const car = await prisma.car.findUnique({ where: { id: data.carId } })
  if (!car) {
    throw new AppError('Авто не найдено для начисления дохода', { status: 404 })
  }

  const account = await resolveAccount(data.accountId)
  const amount = decimal(data.amount)
  const fxRate = decimal(data.fxRateToAed)
  const amountAed = amount.mul(fxRate)

  const income = await prisma.$transaction(async (tx) => {
    const created = await tx.income.create({
      data: {
        carId: data.carId,
        amount,
        currency: data.currency,
        fxRateToAed: fxRate,
        date: data.date,
        buyerName: data.buyerName,
        paymentMethod: data.paymentMethod,
        description: data.description,
      },
    })

    await tx.capitalTxn.create({
      data: {
        accountId: account.id,
        amountAed,
        date: data.date,
        reason: CapitalTxnReason.INCOME_SALE,
        carId: data.carId,
        incomeId: created.id,
        meta: {
          currency: data.currency,
          amount: amount.toString(),
          fxRateToAed: fxRate.toString(),
        },
      },
    })

    return created
  })

  return income
}

export async function listIncomes(limit = 100) {
  const incomes = await prisma.income.findMany({
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      car: {
        select: { id: true, vin: true, make: true, model: true, year: true },
      },
    },
  })

  return incomes.map((income) => ({
    id: income.id,
    car: income.car
      ? {
          id: income.car.id,
          vin: income.car.vin,
          make: income.car.make,
          model: income.car.model,
          year: income.car.year,
        }
      : null,
    amount: income.amount.toNumber(),
    currency: income.currency,
    fxRateToAed: income.fxRateToAed.toNumber(),
    amountAed: income.amount.mul(income.fxRateToAed).toNumber(),
    date: income.date.toISOString(),
    buyerName: income.buyerName,
    paymentMethod: income.paymentMethod,
    description: income.description,
    createdAt: income.createdAt.toISOString(),
  }))
}
