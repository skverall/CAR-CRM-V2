import { NextResponse } from 'next/server'

import { handleError } from '@/lib/errors'
import { getCarById } from '@/server/car'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const car = await getCarById(params.id)
    return NextResponse.json(car)
  } catch (error) {
    return handleError(error)
  }
}
