import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getReportSummary } from '@/server/reports'

vi.mock('@prisma/client', () => {
  class MockDecimal {
    constructor(public readonly value: number) {}
    mul(other: any) {
      const otherValue = other instanceof MockDecimal ? other.value : Number(other)
      return new MockDecimal(this.value * otherValue)
    }
    toNumber() {
      return this.value
    }
  }

  const CapitalAccountType = {
    INVESTOR: 'INVESTOR',
    BUSINESS: 'BUSINESS',
    OWNER: 'OWNER',
    ASSISTANT: 'ASSISTANT',
  } as const

  const CarStatus = {
    IN_STOCK: 'IN_STOCK',
    REPAIRING: 'REPAIRING',
    LISTED: 'LISTED',
    SOLD: 'SOLD',
    ARCHIVED: 'ARCHIVED',
  } as const

  const CapitalTxnReason = {
    PAYOUT_INVESTOR: 'PAYOUT_INVESTOR',
    PAYOUT_OWNER: 'PAYOUT_OWNER',
    PAYOUT_ASSISTANT: 'PAYOUT_ASSISTANT',
  } as const

  const UserRole = {
    OWNER: 'OWNER',
    ASSISTANT: 'ASSISTANT',
  } as const

  return {
    Prisma: { Decimal: MockDecimal },
    CapitalAccountType,
    CarStatus,
    CapitalTxnReason,
    UserRole,
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: { findMany: vi.fn() },
    income: { findMany: vi.fn() },
    car: { findMany: vi.fn() },
  },
}))

const { prisma } = await import('@/lib/prisma')
const { Prisma } = await import('@prisma/client')

const decimal = (value: number) => new Prisma.Decimal(value)

describe('getReportSummary', () => {
  beforeEach(() => {
    vi.mocked(prisma.expense.findMany).mockReset()
    vi.mocked(prisma.income.findMany).mockReset()
    vi.mocked(prisma.car.findMany).mockReset()
  })

  it('aggregates revenue, expenses, and profit per car', async () => {
    vi.mocked(prisma.expense.findMany)
      .mockImplementationOnce(async () => [
        {
          id: 'exp1',
          type: 'REPAIR',
          amount: decimal(2500),
          fxRateToAed: decimal(1),
          date: new Date('2025-06-10'),
          isPersonal: false,
          car: {
            id: 'car1',
            vin: 'KMHXX81BAGU123456',
            make: 'Hyundai',
            model: 'Sonata',
            year: 2019,
            source: 'Korea',
          },
        },
        {
          id: 'exp2',
          type: 'FUEL',
          amount: decimal(150),
          fxRateToAed: decimal(1),
          date: new Date('2025-07-01'),
          isPersonal: false,
          car: {
            id: 'car1',
            vin: 'KMHXX81BAGU123456',
            make: 'Hyundai',
            model: 'Sonata',
            year: 2019,
            source: 'Korea',
          },
        },
      ] as any)
      .mockImplementationOnce(async () => [])

    vi.mocked(prisma.income.findMany).mockResolvedValue([
      {
        id: 'inc1',
        amount: decimal(79000),
        fxRateToAed: decimal(1),
        date: new Date('2025-09-15'),
        car: {
          id: 'car1',
          vin: 'KMHXX81BAGU123456',
          make: 'Hyundai',
          model: 'Sonata',
          year: 2019,
          source: 'Korea',
        },
      },
    ] as any)

    vi.mocked(prisma.car.findMany).mockResolvedValue([
      {
        id: 'car1',
        vin: 'KMHXX81BAGU123456',
        make: 'Hyundai',
        model: 'Sonata',
        year: 2019,
        source: 'Korea',
          buyPrice: 18000,
          buyRate: 3.6725,
      },
    ] as any)

    const summary = await getReportSummary({})

    expect(summary.cars).toHaveLength(1)
    expect(summary.totals.revenueAed).toBeCloseTo(79000)
    expect(summary.totals.directExpensesAed).toBeCloseTo(68755)
    expect(summary.totals.profitAed).toBeCloseTo(10245)

    const car = summary.cars[0]
    expect(car.buyCostAed).toBeCloseTo(66105)
    expect(car.expensesAed).toBeCloseTo(2650)
    expect(car.revenueAed).toBeCloseTo(79000)
    expect(car.profitAed).toBeCloseTo(10245)
  })
})
