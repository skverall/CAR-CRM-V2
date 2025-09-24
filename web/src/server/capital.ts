import { Prisma, CapitalTxnReason, UserRole } from '@prisma/client'

import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { SessionUser } from '@/lib/auth'
import { capitalTxnCreateSchema } from '@/lib/validators/capital'

const decimal = (value: number | string) => new Prisma.Decimal(value)

const ownerOnlyReasons = new Set<CapitalTxnReason>([
  CapitalTxnReason.ADJUST,
  CapitalTxnReason.WITHDRAW_OWNER,
])

export async function listCapitalAccounts() {
  const [accounts, balances] = await Promise.all([
    prisma.capitalAccount.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.capitalTxn.groupBy({
      by: ['accountId'],
      _sum: { amountAed: true },
    }),
  ])

  const balanceMap = new Map(balances.map((item) => [item.accountId, item._sum.amountAed ?? new Prisma.Decimal(0)]))

  return accounts.map((account) => ({
    ...account,
    balanceAed: Number(balanceMap.get(account.id) ?? 0),
  }))
}

export async function listCapitalTransactions(limit = 120) {
  const txns = await prisma.capitalTxn.findMany({
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      account: { select: { id: true, name: true, type: true } },
      car: { select: { id: true, vin: true, make: true, model: true, year: true } },
    },
  })

  return txns.map((txn) => ({
    id: txn.id,
    account: txn.account,
    amountAed: txn.amountAed.toNumber(),
    date: txn.date.toISOString(),
    reason: txn.reason,
    car: txn.car
      ? { id: txn.car.id, vin: txn.car.vin, make: txn.car.make, model: txn.car.model, year: txn.car.year }
      : null,
    meta: txn.meta ?? null,
  }))
}

export async function createCapitalTxn(payload: unknown, user: SessionUser) {
  const data = capitalTxnCreateSchema.parse(payload)

  if (ownerOnlyReasons.has(data.reason) && user.role !== UserRole.OWNER) {
    throw new AppError('Недостаточно прав для этой операции', { status: 403 })
  }

  const account = await prisma.capitalAccount.findUnique({ where: { id: data.accountId } })
  if (!account) {
    throw new AppError('Счёт не найден', { status: 404 })
  }

  const amountAed = decimal(data.amountAed)

  return prisma.capitalTxn.create({
    data: {
      accountId: data.accountId,
      amountAed,
      date: data.date,
      reason: data.reason,
      carId: data.carId ?? null,
      expenseId: data.expenseId ?? null,
      incomeId: data.incomeId ?? null,
      meta: data.note ? { note: data.note } : undefined,
    },
  })
}

