import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { listFxRates, upsertFxRate } from '@/server/fx'

export async function GET() {
  try {
    const rates = await listFxRates()
    return NextResponse.json(rates)
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
