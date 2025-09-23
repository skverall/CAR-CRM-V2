import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth'
import { handleError } from '@/lib/errors'
import { createCar, listCars } from '@/server/car'

export async function GET(request: Request) {
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries())
    const result = await listCars(searchParams)
    return NextResponse.json(result)
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

    const body = await request.json()
    const car = await createCar(body, session.user)
    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
