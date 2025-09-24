import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { getReportSummary } from '@/server/reports'

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined
    const summary = await getReportSummary({ from, to })
    return NextResponse.json(summary)
  } catch (error) {
    return handleError(error)
  }
}

