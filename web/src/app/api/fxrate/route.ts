import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { getRate, listFxRates, upsertFxRate } from '@/server/fx'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const counter = searchParams.get('counter')

    if (counter) {
      const dateParam = searchParams.get('date')
      const lookupDate = dateParam ? new Date(dateParam) : new Date()
      const rate = await getRate(counter.toUpperCase(), lookupDate)
      return NextResponse.json({
        id: rate.id,
        counter: rate.counter,
        rate: rate.rate.toNumber(),
        date: rate.date.toISOString(),
      })
    }

    const rates = await listFxRates()
    return NextResponse.json(
      rates.map((rate) => ({
        id: rate.id,
        counter: rate.counter,
        rate: rate.rate.toNumber(),
        date: rate.date.toISOString(),
      })),
    )
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const rate = await upsertFxRate(body)
    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
