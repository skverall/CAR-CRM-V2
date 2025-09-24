import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profit distribution from the database function
    const { data: profitData, error: profitError } = await (supabase as any)
      .rpc('get_profit_distribution')

    if (profitError) {
      console.error('Error fetching profit distribution:', profitError)
      return NextResponse.json({ error: 'Failed to fetch profit distribution' }, { status: 500 })
    }

    // Get detailed breakdown of income and expenses
    const { data: incomeData, error: incomeError } = await (supabase as any)
      .from('transactions')
      .select('amount_usd')
      .eq('type' as any, 'income' as any)
      .eq('is_personal' as any, false as any)

    if (incomeError) {
      console.error('Error fetching income data:', incomeError)
      return NextResponse.json({ error: 'Failed to fetch income data' }, { status: 500 })
    }

    const { data: expenseData, error: expenseError } = await (supabase as any)
      .from('transactions')
      .select('amount_usd, is_personal')
      .eq('type' as any, 'expense' as any)

    if (expenseError) {
      console.error('Error fetching expense data:', expenseError)
      return NextResponse.json({ error: 'Failed to fetch expense data' }, { status: 500 })
    }

    // Calculate totals
    const totalIncome = incomeData?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`)
    }, 0) || 0

    const businessExpenses = expenseData?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return !t.is_personal ? sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`) : sum
    }, 0) || 0

    const personalExpenses = expenseData?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return t.is_personal ? sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`) : sum
    }, 0) || 0

    const totalExpenses = businessExpenses + personalExpenses
    const netProfit = totalIncome - businessExpenses

    // Get profit distribution from the result
    const distribution = (profitData as any)?.[0] || {
      total_profit: 0,
      investor_share: 0,
      owner_share: 0,
      assistant_share: 0,
    }

    // Calculate percentages
    const investorPercentage = netProfit > 0 ? (distribution.investor_share / netProfit) * 100 : 0
    const ownerPercentage = netProfit > 0 ? (distribution.owner_share / netProfit) * 100 : 0
    const assistantPercentage = netProfit > 0 ? (distribution.assistant_share / netProfit) * 100 : 0

    return NextResponse.json({
      profitDistribution: {
        totalProfit: distribution.total_profit,
        investorShare: distribution.investor_share,
        ownerShare: distribution.owner_share,
        assistantShare: distribution.assistant_share,
        investorPercentage: Math.round(investorPercentage * 100) / 100,
        ownerPercentage: Math.round(ownerPercentage * 100) / 100,
        assistantPercentage: Math.round(assistantPercentage * 100) / 100,
      },
      breakdown: {
        totalIncome,
        businessExpenses,
        personalExpenses,
        totalExpenses,
        netProfit,
      },
      distributionRules: {
        investor: 50, // 50%
        owner: 25,    // 25%
        assistant: 25 // 25%
      }
    })
  } catch (error) {
    console.error('Error in GET /api/profit-distribution:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
