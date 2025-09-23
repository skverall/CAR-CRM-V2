import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { createCapitalTxn } from '@/server/capital'

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const txn = await createCapitalTxn(body, session.user)
    return NextResponse.json(txn, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
