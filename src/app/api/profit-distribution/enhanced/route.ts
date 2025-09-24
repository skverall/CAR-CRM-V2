import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeMonthly = searchParams.get('includeMonthly') === 'true'
    const includeCars = searchParams.get('includeCars') === 'true'
    const monthsBack = parseInt(searchParams.get('monthsBack') || '12')

    // Get profit distribution for the specified period
    const { data: periodDistribution, error: periodError } = await supabase
      .rpc('get_profit_distribution_by_period', {
        start_date: startDate,
        end_date: endDate
      })

    if (periodError) {
      console.error('Error fetching period distribution:', periodError)
      return NextResponse.json({ error: 'Failed to fetch period distribution' }, { status: 500 })
    }

    const result: any = {
      periodDistribution: periodDistribution?.[0] || {
        total_income: 0,
        total_business_expenses: 0,
        total_personal_expenses: 0,
        net_profit: 0,
        investor_share: 0,
        owner_share: 0,
        assistant_share: 0,
        transaction_count: 0,
      },
      filters: {
        startDate: startDate || 'all time',
        endDate: endDate || 'present',
        includeMonthly,
        includeCars,
        monthsBack,
      },
      distributionRules: {
        investor: 50, // 50%
        owner: 25,    // 25%
        assistant: 25 // 25%
      }
    }

    // Get monthly summary if requested
    if (includeMonthly) {
      const { data: monthlySummary, error: monthlyError } = await supabase
        .rpc('get_monthly_profit_summary', {
          months_back: monthsBack
        })

      if (monthlyError) {
        console.error('Error fetching monthly summary:', monthlyError)
        return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 })
      }

      result.monthlySummary = monthlySummary || []
    }

    // Get car-based distribution if requested
    if (includeCars) {
      const { data: carDistribution, error: carError } = await supabase
        .rpc('get_car_profit_distribution')

      if (carError) {
        console.error('Error fetching car distribution:', carError)
        return NextResponse.json({ error: 'Failed to fetch car distribution' }, { status: 500 })
      }

      result.carDistribution = carDistribution || []
    }

    // Get current capital state
    const { data: currentCapital, error: capitalError } = await supabase
      .from('capital')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (capitalError) {
      console.error('Error fetching current capital:', capitalError)
      return NextResponse.json({ error: 'Failed to fetch current capital' }, { status: 500 })
    }

    result.currentCapitalState = {
      totalCapital: currentCapital?.total_capital || 0,
      investorShare: currentCapital?.investor_share || 0,
      ownerShare: currentCapital?.owner_share || 0,
      assistantShare: currentCapital?.assistant_share || 0,
      lastUpdated: currentCapital?.updated_at,
    }

    // Calculate summary statistics
    const periodData = result.periodDistribution
    result.summary = {
      profitMargin: periodData.total_income > 0 ? 
        Math.round((periodData.net_profit / periodData.total_income) * 100 * 100) / 100 : 0,
      expenseRatio: periodData.total_income > 0 ? 
        Math.round((periodData.total_business_expenses / periodData.total_income) * 100 * 100) / 100 : 0,
      personalExpenseRatio: periodData.total_income > 0 ? 
        Math.round((periodData.total_personal_expenses / periodData.total_income) * 100 * 100) / 100 : 0,
      averageTransactionValue: periodData.transaction_count > 0 ? 
        Math.round(((periodData.total_income + periodData.total_business_expenses + periodData.total_personal_expenses) / periodData.transaction_count) * 100) / 100 : 0,
      isPositiveProfit: periodData.net_profit > 0,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/profit-distribution/enhanced:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
