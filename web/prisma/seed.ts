/* eslint-disable no-console */
import {
  CapitalAccountType,
  CapitalTxnReason,
  CarStatus,
  ExpensePaidFrom,
  ExpenseType,
  Prisma,
  PrismaClient,
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

const toDecimal = (value: number | string) => new Prisma.Decimal(value)
const negate = (value: Prisma.Decimal) => value.mul(-1)

async function upsertFxRates() {
  const fxDate = new Date('2025-09-01T00:00:00.000Z')
  const fxRates = [
    { counter: 'KRW', rate: toDecimal('0.0027') },
    { counter: 'USD', rate: toDecimal('3.6725') },
    { counter: 'AED', rate: toDecimal('1') },
  ]

  await Promise.all(
    fxRates.map(({ counter, rate }) =>
      prisma.fxRate.upsert({
        where: { date_counter: { date: fxDate, counter } },
        create: { date: fxDate, counter, rate },
        update: { rate },
      }),
    ),
  )
}

async function upsertUsers() {
  const [owner, investor, assistant] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'owner@auto-uchet.test' },
      update: {},
      create: {
        email: 'owner@auto-uchet.test',
        name: 'Owner',
        role: UserRole.OWNER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'investor@auto-uchet.test' },
      update: {},
      create: {
        email: 'investor@auto-uchet.test',
        name: 'Doniyor',
        role: UserRole.INVESTOR,
      },
    }),
    prisma.user.upsert({
      where: { email: 'assistant@auto-uchet.test' },
      update: {},
      create: {
        email: 'assistant@auto-uchet.test',
        name: 'Assistant',
        role: UserRole.ASSISTANT,
      },
    }),
  ])

  return { owner, investor, assistant }
}

async function upsertCapitalAccounts(users: {
  owner: { id: string }
  investor: { id: string }
  assistant: { id: string }
}) {
  const accounts = await Promise.all([
    prisma.capitalAccount.upsert({
      where: { type_name: { type: CapitalAccountType.BUSINESS, name: 'Business' } },
      update: {},
      create: {
        type: CapitalAccountType.BUSINESS,
        name: 'Business',
      },
    }),
    prisma.capitalAccount.upsert({
      where: { type_name: { type: CapitalAccountType.INVESTOR, name: 'Doniyor' } },
      update: {},
      create: {
        type: CapitalAccountType.INVESTOR,
        name: 'Doniyor',
        userId: users.investor.id,
      },
    }),
    prisma.capitalAccount.upsert({
      where: { type_name: { type: CapitalAccountType.OWNER, name: 'Owner' } },
      update: {},
      create: {
        type: CapitalAccountType.OWNER,
        name: 'Owner',
        userId: users.owner.id,
      },
    }),
    prisma.capitalAccount.upsert({
      where: { type_name: { type: CapitalAccountType.ASSISTANT, name: 'Assistant' } },
      update: {},
      create: {
        type: CapitalAccountType.ASSISTANT,
        name: 'Assistant',
        userId: users.assistant.id,
      },
    }),
  ])

  const [business, investor, owner, assistant] = accounts
  return { business, investor, owner, assistant }
}

async function seedDomain(accounts: {
  business: { id: string }
  investor: { id: string }
  owner: { id: string }
  assistant: { id: string }
}) {
  const depositDate = new Date('2025-08-15T00:00:00.000Z')
  const investorDepositAmount = toDecimal('200000')

  const existingDeposit = await prisma.capitalTxn.findFirst({
    where: {
      accountId: accounts.investor.id,
      reason: CapitalTxnReason.DEPOSIT_INVESTOR,
      amountAed: investorDepositAmount,
    },
  })

  if (!existingDeposit) {
    await prisma.capitalTxn.create({
      data: {
        accountId: accounts.investor.id,
        amountAed: investorDepositAmount,
        date: depositDate,
        reason: CapitalTxnReason.DEPOSIT_INVESTOR,
        meta: { note: 'Initial investor deposit' },
      },
    })
  }

  const car = await prisma.car.upsert({
    where: { vin: 'KMHXX81BAGU123456' },
    update: {
      status: CarStatus.SOLD,
      buyPrice: toDecimal('18000'),
      buyRate: toDecimal('3.6725'),
      buyCurrency: 'USD',
      buyDate: new Date('2025-05-01T00:00:00.000Z'),
      make: 'Hyundai',
      model: 'Sonata',
      year: 2019,
      source: 'Korea',
      notes: 'Seed data: Hyundai Sonata 2019',
    },
    create: {
      vin: 'KMHXX81BAGU123456',
      status: CarStatus.SOLD,
      buyPrice: toDecimal('18000'),
      buyRate: toDecimal('3.6725'),
      buyCurrency: 'USD',
      buyDate: new Date('2025-05-01T00:00:00.000Z'),
      make: 'Hyundai',
      model: 'Sonata',
      year: 2019,
      source: 'Korea',
      notes: 'Seed data: Hyundai Sonata 2019',
    },
  })

  const purchaseAed = toDecimal('66105')
  const purchaseTxn = await prisma.capitalTxn.findFirst({
    where: {
      accountId: accounts.investor.id,
      reason: CapitalTxnReason.BUY_CAR,
      carId: car.id,
    },
  })
  if (!purchaseTxn) {
    await prisma.capitalTxn.create({
      data: {
        accountId: accounts.investor.id,
        carId: car.id,
        amountAed: negate(purchaseAed),
        date: new Date('2025-05-02T00:00:00.000Z'),
        reason: CapitalTxnReason.BUY_CAR,
        meta: { currency: 'USD', amount: '18000', fxRateToAed: '3.6725' },
      },
    })
  }

  const expenses = [
    {
      type: ExpenseType.REPAIR,
      amount: toDecimal('2500'),
      description: 'Repair works',
      date: new Date('2025-06-10T00:00:00.000Z'),
    },
    {
      type: ExpenseType.FUEL,
      amount: toDecimal('150'),
      description: 'Fuel top-up',
      date: new Date('2025-07-01T00:00:00.000Z'),
    },
  ]

  for (const expense of expenses) {
    const existing = await prisma.expense.findFirst({
      where: {
        carId: car.id,
        type: expense.type,
        amount: expense.amount,
        date: expense.date,
      },
    })

    const expenseRecord = existing
      ? existing
      : await prisma.expense.create({
          data: {
            carId: car.id,
            type: expense.type,
            amount: expense.amount,
            currency: 'AED',
            fxRateToAed: toDecimal('1'),
            date: expense.date,
            paidFrom: ExpensePaidFrom.BUSINESS_FUNDS,
            description: expense.description,
          },
        })

    const expenseTxn = await prisma.capitalTxn.findFirst({
      where: {
        accountId: accounts.business.id,
        reason: CapitalTxnReason.EXPENSE_CAR,
        expenseId: expenseRecord.id,
      },
    })

    if (!expenseTxn) {
      await prisma.capitalTxn.create({
        data: {
          accountId: accounts.business.id,
          amountAed: negate(expense.amount),
          date: expense.date,
          reason: CapitalTxnReason.EXPENSE_CAR,
          carId: car.id,
          expenseId: expenseRecord.id,
          meta: { note: expense.description },
        },
      })
    }
  }

  const incomeDate = new Date('2025-09-15T00:00:00.000Z')
  const saleAmount = toDecimal('79000')

  let incomeRecord = await prisma.income.findFirst({
    where: { carId: car.id },
  })

  if (incomeRecord) {
    incomeRecord = await prisma.income.update({
      where: { id: incomeRecord.id },
      data: {
        amount: saleAmount,
        currency: 'AED',
        fxRateToAed: toDecimal('1'),
        date: incomeDate,
        buyerName: 'Local Buyer',
        paymentMethod: 'Bank transfer',
        description: 'Seed sale transaction',
      },
    })
  } else {
    incomeRecord = await prisma.income.create({
      data: {
        carId: car.id,
        amount: saleAmount,
        currency: 'AED',
        fxRateToAed: toDecimal('1'),
        date: incomeDate,
        buyerName: 'Local Buyer',
        paymentMethod: 'Bank transfer',
        description: 'Seed sale transaction',
      },
    })
  }

  const saleTxn = await prisma.capitalTxn.findFirst({
    where: {
      accountId: accounts.business.id,
      reason: CapitalTxnReason.INCOME_SALE,
      incomeId: incomeRecord.id,
    },
  })
  if (!saleTxn) {
    await prisma.capitalTxn.create({
      data: {
        accountId: accounts.business.id,
        carId: car.id,
        incomeId: incomeRecord.id,
        amountAed: saleAmount,
        date: incomeDate,
        reason: CapitalTxnReason.INCOME_SALE,
        meta: { note: 'Sale proceeds' },
      },
    })
  }

  const directCosts = purchaseAed.add(toDecimal('2500')).add(toDecimal('150'))
  const profit = saleAmount.sub(directCosts)

  if (profit.greaterThan(0)) {
    const investorShare = profit.mul('0.50')
    const assistantShare = profit.mul('0.25')
    const ownerShare = profit.mul('0.25')

    const payoutPlans = [
      {
        accountId: accounts.investor.id,
        amount: investorShare,
        reason: CapitalTxnReason.PAYOUT_INVESTOR,
        meta: { recipient: 'Investor Doniyor' },
      },
      {
        accountId: accounts.assistant.id,
        amount: assistantShare,
        reason: CapitalTxnReason.PAYOUT_ASSISTANT,
        meta: { recipient: 'Assistant' },
      },
      {
        accountId: accounts.owner.id,
        amount: ownerShare,
        reason: CapitalTxnReason.PAYOUT_OWNER,
        meta: { recipient: 'Owner' },
      },
    ]

    const payoutDate = new Date('2025-09-20T00:00:00.000Z')

    for (const plan of payoutPlans) {
      const alreadyPaid = await prisma.capitalTxn.findFirst({
        where: {
          accountId: plan.accountId,
          carId: car.id,
          reason: plan.reason,
        },
      })

      if (alreadyPaid) {
        continue
      }

      await prisma.capitalTxn.create({
        data: {
          accountId: accounts.business.id,
          amountAed: negate(plan.amount),
          date: payoutDate,
          reason: plan.reason,
          carId: car.id,
          meta: { ...plan.meta, distributionSourceAccountId: accounts.business.id },
        },
      })

      await prisma.capitalTxn.create({
        data: {
          accountId: plan.accountId,
          amountAed: plan.amount,
          date: payoutDate,
          reason: plan.reason,
          carId: car.id,
          meta: { ...plan.meta, distributionSourceAccountId: accounts.business.id },
        },
      })
    }
  }
}

async function main() {
  await upsertFxRates()
  const users = await upsertUsers()
  const accounts = await upsertCapitalAccounts(users)
  await seedDomain(accounts)

  console.log('Seed data applied successfully')
}

main()
  .catch((error) => {
    console.error('Seed failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

