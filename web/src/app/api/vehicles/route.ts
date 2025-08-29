import { NextRequest } from 'next/server'
import { prisma } from '../../../server/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const investorId = searchParams.get('investorId')
  const q = searchParams.get('q')
  const year = searchParams.get('year')
  const roiMin = searchParams.get('roiMin')
  const roiMax = searchParams.get('roiMax')
  const limit = Number(searchParams.get('limit') || '50')
  const offset = Number(searchParams.get('offset') || '0')

  const where: string[] = []
  const params: any[] = []

  if (status) {
    params.push(status)
    where.push(`status = $${params.length}`)
  }
  if (investorId) {
    params.push(investorId)
    where.push(`investor_id = $${params.length}`)
  }
  if (year) {
    params.push(Number(year))
    where.push(`year = $${params.length}`)
  }
  if (roiMin) {
    params.push(Number(roiMin))
    where.push(`roi >= $${params.length}`)
  }
  if (roiMax) {
    params.push(Number(roiMax))
    where.push(`roi <= $${params.length}`)
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`)
    where.push(`(lower(make) like $${params.length} or lower(model) like $${params.length} or lower(coalesce(vin,'')) like $${params.length})`)
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  params.push(limit)
  params.push(offset)

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `select * from vw_vehicle_finance ${whereSql} order by date_purchased desc limit $${params.length - 1} offset $${params.length};`,
    ...params
  )
  return Response.json(rows)
}

