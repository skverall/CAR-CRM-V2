import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { getDashboardOverview } from '@/server/reports'

export async function GET() {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const overview = await getDashboardOverview()
    return NextResponse.json(overview)
  } catch (error) {
    return handleError(error)
  }
}
