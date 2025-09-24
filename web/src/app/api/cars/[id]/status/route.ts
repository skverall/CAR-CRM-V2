import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { updateCarStatus } from '@/server/car'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const car = await updateCarStatus(params.id, body, session.user)
    return NextResponse.json(car)
  } catch (error) {
    return handleError(error)
  }
}
