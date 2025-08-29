import { NextRequest } from 'next/server'
import { prisma } from '@/src/server/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // options or positions
  if (type === 'options') {
    const rows = await prisma.investors.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
    return Response.json(rows)
  }
  // default: positions (view)
  const rows = await prisma.$queryRawUnsafe<any[]>(`select * from vw_investor_positions order by name asc;`)
  return Response.json(rows)
}

