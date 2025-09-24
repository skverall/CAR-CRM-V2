import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // monthly, quarterly, yearly
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const carId = searchParams.get('carId')

    // Build base query for transactions
    let baseQuery = (supabase as any)
      .from('transactions')
      .select('type, amount_usd, is_personal, car_id, date, category, created_at')

    // Apply filters
    if (startDate) {
      baseQuery = baseQuery.gte('date', startDate)
    }

    if (endDate) {
      baseQuery = baseQuery.lte('date', endDate)
    }

    if (carId) {
      baseQuery = baseQuery.eq('car_id' as any, carId as any)
    }

    const { data: transactions, error } = await baseQuery

    if (error) {
      console.error('Error fetching transactions for analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Group transactions by period
    const periodData: Record<string, {
      income: number
      businessExpenses: number
      personalExpenses: number
      netProfit: number
      investorShare: number
      ownerShare: number
      assistantShare: number
      transactionCount: number
    }> = {}

    transactions?.forEach((transaction: any) => {
      const t = transaction as any
      const amount = parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`)
      const date = new Date(t.date)

      // Determine period key based on period type
      let periodKey: string
      switch (period) {
        case 'yearly':
          periodKey = date.getFullYear().toString()
          break
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          periodKey = `${date.getFullYear()}-Q${quarter}`
          break
        case 'monthly':
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }

      // Initialize period data if not exists
      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          income: 0,
          businessExpenses: 0,
          personalExpenses: 0,
          netProfit: 0,
          investorShare: 0,
          ownerShare: 0,
          assistantShare: 0,
          transactionCount: 0,
        }
      }

      const period_data = periodData[periodKey]
      period_data.transactionCount++

      if (t.type === 'income') {
        period_data.income += amount
      } else if (t.type === 'expense') {
        if (t.is_personal) {
          period_data.personalExpenses += amount
        } else {
          period_data.businessExpenses += amount
        }
      }
    })

    // Calculate profit distribution for each period
    Object.keys(periodData).forEach(periodKey => {
      const data = periodData[periodKey]
      data.netProfit = data.income - data.businessExpenses

      if (data.netProfit > 0) {
        data.investorShare = Math.round(data.netProfit * 0.5 * 100) / 100 // 50%
        const remainingProfit = data.netProfit - data.investorShare
        data.ownerShare = Math.round(remainingProfit * 0.5 * 100) / 100 // 25%
        data.assistantShare = Math.round(remainingProfit * 0.5 * 100) / 100 // 25%
      }
    })

    // Convert to array and sort by period
    const periodAnalytics = Object.entries(periodData)
      .map(([period, data]) => ({
        period,
        ...data
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // Calculate totals and averages
    const totals = periodAnalytics.reduce((acc, period) => ({
      totalIncome: acc.totalIncome + period.income,
      totalBusinessExpenses: acc.totalBusinessExpenses + period.businessExpenses,
      totalPersonalExpenses: acc.totalPersonalExpenses + period.personalExpenses,
      totalNetProfit: acc.totalNetProfit + period.netProfit,
      totalInvestorShare: acc.totalInvestorShare + period.investorShare,
      totalOwnerShare: acc.totalOwnerShare + period.ownerShare,
      totalAssistantShare: acc.totalAssistantShare + period.assistantShare,
      totalTransactions: acc.totalTransactions + period.transactionCount,
    }), {
      totalIncome: 0,
      totalBusinessExpenses: 0,
      totalPersonalExpenses: 0,
      totalNetProfit: 0,
      totalInvestorShare: 0,
      totalOwnerShare: 0,
      totalAssistantShare: 0,
      totalTransactions: 0,
    })

    const periodCount = periodAnalytics.length
    const averages = periodCount > 0 ? {
      averageIncome: Math.round(totals.totalIncome / periodCount * 100) / 100,
      averageBusinessExpenses: Math.round(totals.totalBusinessExpenses / periodCount * 100) / 100,
      averagePersonalExpenses: Math.round(totals.totalPersonalExpenses / periodCount * 100) / 100,
      averageNetProfit: Math.round(totals.totalNetProfit / periodCount * 100) / 100,
      averageInvestorShare: Math.round(totals.totalInvestorShare / periodCount * 100) / 100,
      averageOwnerShare: Math.round(totals.totalOwnerShare / periodCount * 100) / 100,
      averageAssistantShare: Math.round(totals.totalAssistantShare / periodCount * 100) / 100,
      averageTransactions: Math.round(totals.totalTransactions / periodCount * 100) / 100,
    } : null

    return NextResponse.json({
      analytics: periodAnalytics,
      summary: {
        period,
        periodCount,
        totals,
        averages,
        distributionRules: {
          investor: 50, // 50%
          owner: 25,    // 25%
          assistant: 25 // 25%
        }
      },
      filters: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        carId: carId || 'all',
        period
      }
    })
  } catch (error) {
    console.error('Error in GET /api/profit-analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
