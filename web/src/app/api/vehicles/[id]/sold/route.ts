import { NextRequest } from 'next/server'
import { prisma } from '../../../../../server/db'
import { Prisma } from '../../../../../generated/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await req.json().catch(() => ({}))
  const { sold_price, date_sold } = body || {}
  if (sold_price == null || !date_sold) {
    return new Response(JSON.stringify({ error: 'sold_price and date_sold required' }), { status: 400 })
  }
  try {
    const updated = await prisma.vehicles.update({
      where: { id },
      data: {
        status: 'Sold' as any,
        sold_price: new Prisma.Decimal(Number(sold_price)),
        date_sold: new Date(date_sold),
      },
    })
    return Response.json({ ok: true, id: updated.id })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 })
  }
}

