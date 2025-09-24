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

    // Get dashboard stats from the view
    const { data: stats, error: statsError } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single()

    if (statsError) {
      console.error('Error fetching dashboard stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }

    // Get profit distribution
    const { data: profitData, error: profitError } = await supabase
      .rpc('get_profit_distribution')

    if (profitError) {
      console.error('Error fetching profit distribution:', profitError)
      return NextResponse.json({ error: 'Failed to fetch profit distribution' }, { status: 500 })
    }

    // Get monthly trends (last 12 months)
    const { data: monthlyTrends, error: trendsError } = await supabase
      .from('monthly_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(12)

    if (trendsError) {
      console.error('Error fetching monthly trends:', trendsError)
      return NextResponse.json({ error: 'Failed to fetch monthly trends' }, { status: 500 })
    }

    // Get category breakdown
    const { data: categoryBreakdown, error: categoryError } = await supabase
      .from('category_analysis')
      .select('*')
      .order('total_amount', { ascending: false })

    if (categoryError) {
      console.error('Error fetching category breakdown:', categoryError)
      return NextResponse.json({ error: 'Failed to fetch category breakdown' }, { status: 500 })
    }

    // Get top performing cars
    const { data: topCars, error: carsError } = await supabase
      .from('car_profitability')
      .select('*')
      .order('net_profit', { ascending: false })
      .limit(5)

    if (carsError) {
      console.error('Error fetching top cars:', carsError)
      return NextResponse.json({ error: 'Failed to fetch top cars' }, { status: 500 })
    }

    return NextResponse.json({
      stats,
      profitDistribution: (profitData as any)?.[0] || {
        total_profit: 0,
        investor_share: 0,
        owner_share: 0,
        assistant_share: 0,
      },
      monthlyTrends: monthlyTrends?.reverse() || [], // Reverse to show oldest first
      categoryBreakdown: categoryBreakdown || [],
      topCars: topCars || [],
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
