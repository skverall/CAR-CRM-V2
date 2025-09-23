import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { distributeProfit } from '@/server/car'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await distributeProfit(params.id, session.user)
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error)
  }
}


