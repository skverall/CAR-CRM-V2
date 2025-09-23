import { Prisma, CarStatus, CapitalAccountType, CapitalTxnReason, UserRole } from '@prisma/client'

import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { SessionUser } from '@/lib/auth'
import { carCreateSchema, carListQuerySchema } from '@/lib/validators/cars'

const DECIMAL_ZERO = new Prisma.Decimal(0)
const decimal = (value: number | string) => new Prisma.Decimal(value)
const negate = (value: Prisma.Decimal) => value.mul(-1)

const roleCanManageCars = new Set<UserRole>([UserRole.OWNER, UserRole.ASSISTANT])

function ensureCanManage(user: SessionUser) {
  if (!roleCanManageCars.has(user.role)) {
    throw new AppError('Недостаточно прав для управления автомобилями', { status: 403 })
  }
}

function sumToAed(records: Array<{ amount: Prisma.Decimal; fxRateToAed: Prisma.Decimal }>) {
  return records.reduce((total, record) => total.add(record.amount.mul(record.fxRateToAed)), DECIMAL_ZERO)
}

function toPlainCar(car: Awaited<ReturnType<typeof prisma.car.findFirst>>) {
  if (!car) return null
  return {
    id: car.id,
    vin: car.vin,
    make: car.make,
    model: car.model,
    year: car.year,
    status: car.status,
    buyDate: car.buyDate.toISOString(),
    buyPrice: car.buyPrice.toNumber(),
    buyCurrency: car.buyCurrency,
    buyRate: car.buyRate.toNumber(),
    source: car.source,
    notes: car.notes,
    createdAt: car.createdAt.toISOString(),
    updatedAt: car.updatedAt.toISOString(),
  }
}

export async function createCar(payload: unknown, user: SessionUser) {
  ensureCanManage(user)
  const data = carCreateSchema.parse(payload)

  const buyPrice = decimal(data.buyPrice)
  const buyRate = decimal(data.buyRate)
  const valueAed = buyPrice.mul(buyRate)

  const fundingAccount = data.fundingAccountId
    ? await prisma.capitalAccount.findUnique({ where: { id: data.fundingAccountId } })
    : await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.BUSINESS } })

  if (!fundingAccount) {
    throw new AppError('Не удалось определить счёт для финансирования покупки', { status: 400 })
  }

  const car = await prisma.$transaction(async (tx) => {
    const created = await tx.car.create({
      data: {
        vin: data.vin,
        make: data.make,
        model: data.model,
        year: data.year,
        buyDate: data.buyDate,
        buyPrice,
        buyCurrency: data.buyCurrency,
        buyRate,
        source: data.source,
        notes: data.notes,
        status: CarStatus.IN_STOCK,
      },
    })

    await tx.capitalTxn.create({
      data: {
        accountId: fundingAccount.id,
        amountAed: negate(valueAed),
        date: data.buyDate,
        reason: CapitalTxnReason.BUY_CAR,
        carId: created.id,
        meta: {
          currency: data.buyCurrency,
          buyPrice: buyPrice.toString(),
          fxRateToAed: buyRate.toString(),
        },
      },
    })

    return created
  })

  return toPlainCar(car)
}

export async function listCars(query: unknown) {
  const params = carListQuerySchema.parse(query)
  const where: Prisma.CarWhereInput = {}

  if (params.status) {
    where.status = params.status
  }

  if (params.query) {
    where.OR = [
      { vin: { contains: params.query, mode: 'insensitive' } },
      { make: { contains: params.query, mode: 'insensitive' } },
      { model: { contains: params.query, mode: 'insensitive' } },
    ]
  }

  const take = params.pageSize
  const skip = (params.page - 1) * params.pageSize

  const [cars, total] = await prisma.$transaction([
    prisma.car.findMany({
      where,
      orderBy: { buyDate: 'desc' },
      skip,
      take,
    }),
    prisma.car.count({ where }),
  ])

  if (cars.length === 0) {
    return { items: [], total, page: params.page, pageSize: params.pageSize }
  }

  const carIds = cars.map((car) => car.id)

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { carId: { in: carIds }, isPersonal: false },
      select: { carId: true, amount: true, fxRateToAed: true },
    }),
    prisma.income.findMany({
      where: { carId: { in: carIds } },
      select: { carId: true, amount: true, fxRateToAed: true },
    }),
  ])

  const expenseByCar = new Map<string, typeof expenses>()
  const incomeByCar = new Map<string, typeof incomes>()

  for (const expense of expenses) {
    const list = expenseByCar.get(expense.carId) ?? []
    list.push(expense)
    expenseByCar.set(expense.carId, list)
  }

  for (const income of incomes) {
    const list = incomeByCar.get(income.carId) ?? []
    list.push(income)
    incomeByCar.set(income.carId, list)
  }

  const items = cars.map((car) => {
    const carExpenses = expenseByCar.get(car.id) ?? []
    const carIncomes = incomeByCar.get(car.id) ?? []
    const buyCostAed = car.buyPrice.mul(car.buyRate)
    const expenseSum = sumToAed(carExpenses)
    const revenue = sumToAed(carIncomes)
    const directCosts = buyCostAed.add(expenseSum)
    const profit = revenue.sub(directCosts)
    const roi = directCosts.equals(DECIMAL_ZERO) ? DECIMAL_ZERO : profit.div(directCosts)

    return {
      id: car.id,
      vin: car.vin,
      make: car.make,
      model: car.model,
      year: car.year,
      status: car.status,
      buyDate: car.buyDate.toISOString(),
      buyPrice: car.buyPrice.toNumber(),
      buyCurrency: car.buyCurrency,
      buyRate: car.buyRate.toNumber(),
      source: car.source,
      createdAt: car.createdAt.toISOString(),
      metrics: {
        buyCostAed: buyCostAed.toNumber(),
        expensesAed: expenseSum.toNumber(),
        revenueAed: revenue.toNumber(),
        profitAed: profit.toNumber(),
        roiPercentage: roi.mul(100).toNumber(),
      },
    }
  })

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function getCarById(id: string) {
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { date: 'asc' } },
      incomes: { orderBy: { date: 'asc' } },
      capitalTxns: { orderBy: { date: 'asc' } },
    },
  })

  if (!car) {
    throw new AppError('Автомобиль не найден', { status: 404 })
  }

  const directExpenses = car.expenses.filter((expense) => !expense.isPersonal)
  const expenseSum = sumToAed(directExpenses)
  const revenue = sumToAed(car.incomes)
  const buyCost = car.buyPrice.mul(car.buyRate)
  const directCosts = buyCost.add(expenseSum)
  const profit = revenue.sub(directCosts)

  return {
    car: {
      id: car.id,
      vin: car.vin,
      make: car.make,
      model: car.model,
      year: car.year,
      status: car.status,
      buyDate: car.buyDate.toISOString(),
      buyPrice: car.buyPrice.toNumber(),
      buyCurrency: car.buyCurrency,
      buyRate: car.buyRate.toNumber(),
      source: car.source,
      notes: car.notes,
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
      expenses: car.expenses.map((expense) => ({
        ...expense,
        amount: expense.amount.toNumber(),
        fxRateToAed: expense.fxRateToAed.toNumber(),
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      })),
      incomes: car.incomes.map((income) => ({
        ...income,
        amount: income.amount.toNumber(),
        fxRateToAed: income.fxRateToAed.toNumber(),
        date: income.date.toISOString(),
        createdAt: income.createdAt.toISOString(),
        updatedAt: income.updatedAt.toISOString(),
      })),
      capitalTxns: car.capitalTxns.map((txn) => ({
        ...txn,
        amountAed: txn.amountAed.toNumber(),
        date: txn.date.toISOString(),
        createdAt: txn.createdAt.toISOString(),
      })),
    },
    metrics: {
      buyCostAed: buyCost.toNumber(),
      expensesAed: expenseSum.toNumber(),
      revenueAed: revenue.toNumber(),
      profitAed: profit.toNumber(),
    },
  }
}

export async function distributeProfit(carId: string, user: SessionUser) {
  ensureCanManage(user)
  const car = await prisma.car.findUnique({
    where: { id: carId },
    include: {
      expenses: true,
      incomes: true,
      capitalTxns: true,
    },
  })

  if (!car) {
    throw new AppError('Автомобиль не найден', { status: 404 })
  }

  if (car.status !== CarStatus.SOLD) {
    throw new AppError('Прибыль можно распределять только после продажи', { status: 400 })
  }

  const directExpenses = car.expenses.filter((expense) => !expense.isPersonal)
  const expenseSum = sumToAed(directExpenses)
  const revenue = sumToAed(car.incomes)
  const buyCost = car.buyPrice.mul(car.buyRate)
  const profit = revenue.sub(buyCost.add(expenseSum))

  if (profit.lte(DECIMAL_ZERO)) {
    throw new AppError('Прибыль отсутствует', { status: 400 })
  }

  const existingPayout = car.capitalTxns.some((txn) =>
    [
      CapitalTxnReason.PAYOUT_INVESTOR,
      CapitalTxnReason.PAYOUT_OWNER,
      CapitalTxnReason.PAYOUT_ASSISTANT,
    ].includes(txn.reason),
  )

  if (existingPayout) {
    throw new AppError('Прибыль уже распределена для этого авто', { status: 409 })
  }

  const businessAccount = await prisma.capitalAccount.findFirst({
    where: { type: CapitalAccountType.BUSINESS },
  })

  if (!businessAccount) {
    throw new AppError('Не найден бизнес-счёт для распределения', { status: 400 })
  }

  const buyTxn = car.capitalTxns.find((txn) => txn.reason === CapitalTxnReason.BUY_CAR)
  const investorAccount = buyTxn
    ? await prisma.capitalAccount.findUnique({ where: { id: buyTxn.accountId } })
    : await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.INVESTOR } })

  if (!investorAccount) {
    throw new AppError('Не найден инвесторский счёт', { status: 400 })
  }

  const ownerAccount = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.OWNER } })
  const assistantAccount = await prisma.capitalAccount.findFirst({ where: { type: CapitalAccountType.ASSISTANT } })

  if (!ownerAccount || !assistantAccount) {
    throw new AppError('Отсутствуют счета владельца или помощника', { status: 400 })
  }

  const investorShare = profit.mul(0.5)
  const assistantShare = profit.mul(0.25)
  const ownerShare = profit.mul(0.25)

  const payoutDate = new Date()

  await prisma.$transaction(async (tx) => {
    const createPair = async (accountId: string, amount: Prisma.Decimal, reason: CapitalTxnReason, recipient: string) => {
      await tx.capitalTxn.create({
        data: {
          accountId: businessAccount.id,
          amountAed: negate(amount),
          date: payoutDate,
          reason,
          carId: car.id,
          meta: { recipient, sourceAccount: businessAccount.id },
        },
      })

      await tx.capitalTxn.create({
        data: {
          accountId,
          amountAed: amount,
          date: payoutDate,
          reason,
          carId: car.id,
          meta: { recipient, sourceAccount: businessAccount.id },
        },
      })
    }

    await createPair(investorAccount.id, investorShare, CapitalTxnReason.PAYOUT_INVESTOR, investorAccount.name)
    await createPair(assistantAccount.id, assistantShare, CapitalTxnReason.PAYOUT_ASSISTANT, assistantAccount.name)
    await createPair(ownerAccount.id, ownerShare, CapitalTxnReason.PAYOUT_OWNER, ownerAccount.name)
  })

  return {
    investorShare: investorShare.toNumber(),
    assistantShare: assistantShare.toNumber(),
    ownerShare: ownerShare.toNumber(),
    profitAed: profit.toNumber(),
  }
}
