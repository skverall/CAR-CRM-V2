import { describe, expect, it, beforeEach, vi } from 'vitest'
import { updateCarStatus } from '@/server/car'

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

  const CarStatus = {
    IN_STOCK: 'IN_STOCK',
    REPAIRING: 'REPAIRING',
    LISTED: 'LISTED',
    SOLD: 'SOLD',
    ARCHIVED: 'ARCHIVED',
  } as const

  const CapitalAccountType = {
    INVESTOR: 'INVESTOR',
    BUSINESS: 'BUSINESS',
    OWNER: 'OWNER',
    ASSISTANT: 'ASSISTANT',
  } as const

  const CapitalTxnReason = {
    BUY_CAR: 'BUY_CAR',
  } as const

  const UserRole = {
    OWNER: 'OWNER',
    ASSISTANT: 'ASSISTANT',
  } as const

  return {
    Prisma: { Decimal: MockDecimal },
    CarStatus,
    CapitalAccountType,
    CapitalTxnReason,
    UserRole,
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    car: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/lib/prisma')
const { Prisma } = await import('@prisma/client')

const decimal = (value: number) => new Prisma.Decimal(value)

const baseCar = {
  id: 'car1',
  vin: 'VIN123456789',
  make: 'Hyundai',
  model: 'Sonata',
  year: 2019,
  status: 'LISTED',
  buyDate: new Date('2025-05-01'),
  buyPrice: decimal(18000),
  buyCurrency: 'USD',
  buyRate: decimal(3.6725),
  source: 'Korea',
  notes: null,
  createdAt: new Date('2025-05-01'),
  updatedAt: new Date('2025-05-10'),
}

describe('updateCarStatus', () => {
  beforeEach(() => {
    vi.mocked(prisma.car.findUnique).mockReset()
    vi.mocked(prisma.car.update).mockReset()
  })

  it('throws when attempting to move status backwards', async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue(baseCar as any)

    await expect(
      updateCarStatus('car1', { status: 'IN_STOCK' }, { id: 'user1', role: 'OWNER', email: null, name: null }),
    ).rejects.toThrowError()
  })

  it('updates status when transition is allowed', async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue(baseCar as any)
    vi.mocked(prisma.car.update).mockResolvedValue({ ...baseCar, status: 'SOLD', updatedAt: new Date('2025-09-15') } as any)

    const result = await updateCarStatus('car1', { status: 'SOLD' }, { id: 'user1', role: 'OWNER', email: null, name: null })

    expect(prisma.car.update).toHaveBeenCalledWith({
      where: { id: 'car1' },
      data: { status: 'SOLD' },
    })
    expect(result?.status).toBe('SOLD')
    expect(result?.vin).toBe(baseCar.vin)
  })
})
