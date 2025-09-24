import { Prisma } from '@prisma/client'

import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { fxRateUpsertSchema } from '@/lib/validators/fx'

const decimal = (value: number | string) => new Prisma.Decimal(value)

export async function upsertFxRate(payload: unknown) {
  const data = fxRateUpsertSchema.parse(payload)

  const rate = decimal(data.rate)

  return prisma.fxRate.upsert({
    where: { date_counter: { date: data.date, counter: data.counter } },
    update: { rate },
    create: { date: data.date, counter: data.counter, rate },
  })
}

export async function getRate(counter: string, date: Date) {
  const fxRate = await prisma.fxRate.findFirst({
    where: {
      counter,
      date: { lte: date },
    },
    orderBy: { date: 'desc' },
  })

  if (!fxRate) {
    throw new AppError(`Курс для валюты ${counter} не найден`, { status: 404 })
  }

  return fxRate
}

export async function listFxRates() {
  return prisma.fxRate.findMany({ orderBy: { date: 'desc' } })
}

