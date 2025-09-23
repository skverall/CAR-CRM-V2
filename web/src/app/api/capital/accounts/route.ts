import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { listCapitalAccounts } from '@/server/capital'

export async function GET() {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await listCapitalAccounts()
    return NextResponse.json(accounts)
  } catch (error) {
    return handleError(error)
  }
}
