import { NextRequest } from 'next/server'
import { prisma } from '@/src/server/db'
import { Prisma } from '@/src/generated/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const investorId = searchParams.get('investorId')
  const vehicleId = searchParams.get('vehicleId')
  const category = searchParams.get('category')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const limit = Number(searchParams.get('limit') || '100')
  const offset = Number(searchParams.get('offset') || '0')

  const where: any = {}
  if (investorId) where.investor_id = investorId
  if (vehicleId) where.vehicle_id = vehicleId
  if (category) where.category = category
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) where.date.gte = new Date(dateFrom)
    if (dateTo) where.date.lte = new Date(dateTo)
  }

  const [rows, total] = await Promise.all([
    prisma.expenses.findMany({ where, orderBy: { date: 'desc' }, take: limit, skip: offset }),
    prisma.expenses.count({ where }),
  ])
  return Response.json({ rows, total })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  const { date, amount, category, description, notes, investor_id, vehicle_id } = body
  if (!date || amount == null || !category) return new Response(JSON.stringify({ error: 'date, amount, category required' }), { status: 400 })
  try {
    const row = await prisma.expenses.create({
      data: {
        date: new Date(date),
        amount: new Prisma.Decimal(Number(amount)),
        category,
        description: description || null,
        notes: notes || null,
        investor_id: investor_id || null,
        vehicle_id: vehicle_id || null,
      },
    })
    return Response.json(row)
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 })
  }
}

