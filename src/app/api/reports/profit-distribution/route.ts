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
    const format = searchParams.get('format') || 'json' // json, csv
    const includePersonalExpenses = searchParams.get('includePersonalExpenses') === 'true'

    // Get user profile for role-based access
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role, full_name, email')
      .eq('id' as any, user.id as any)
      .single()

    // Build transactions query
    let transactionsQuery = supabase
      .from('transactions')
      .select(`
        id,
        type,
        category,
        amount,
        currency,
        amount_usd,
        description,
        date,
        is_personal,
        created_at,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name, role)
      `)
      .order('date', { ascending: false })

    // Apply date filters
    if (startDate) {
      transactionsQuery = transactionsQuery.gte('date', startDate)
    }

    if (endDate) {
      transactionsQuery = transactionsQuery.lte('date', endDate)
    }

    const { data: transactions, error: transactionsError } = await transactionsQuery

    if (transactionsError) {
      console.error('Error fetching transactions for report:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Get current capital distribution
    const { data: capital, error: capitalError } = await supabase
      .from('capital')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (capitalError) {
      console.error('Error fetching capital for report:', capitalError)
      return NextResponse.json({ error: 'Failed to fetch capital data' }, { status: 500 })
    }

    // Calculate report data
    let totalIncome = 0
    let totalBusinessExpenses = 0
    let totalPersonalExpenses = 0
    const categoryBreakdown: Record<string, { income: number, expense: number, count: number }> = {}
    const monthlyBreakdown: Record<string, { income: number, businessExpenses: number, personalExpenses: number, netProfit: number }> = {}
    const carBreakdown: Record<string, { income: number, expenses: number, netProfit: number, carInfo: any }> = {}

    transactions?.forEach(transaction => {
      const t = transaction as any
      const amount = parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`)
      const month = (t.date as string).substring(0, 7) // YYYY-MM
      const carId = t.car?.id || 'no-car'

      // Initialize breakdowns
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { income: 0, expense: 0, count: 0 }
      }
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { income: 0, businessExpenses: 0, personalExpenses: 0, netProfit: 0 }
      }
      if (!carBreakdown[carId]) {
        carBreakdown[carId] = {
          income: 0,
          expenses: 0,
          netProfit: 0,
          carInfo: t.car || { id: null, vin: 'N/A', brand: 'No Car', model: '', year: null }
        }
      }

      categoryBreakdown[t.category].count++

      if (t.type === 'income') {
        totalIncome += amount
        categoryBreakdown[t.category].income += amount
        monthlyBreakdown[month].income += amount
        if (carId !== 'no-car') {
          carBreakdown[carId].income += amount
        }
      } else if (t.type === 'expense') {
        categoryBreakdown[t.category].expense += amount
        if (t.is_personal) {
          totalPersonalExpenses += amount
          monthlyBreakdown[month].personalExpenses += amount
        } else {
          totalBusinessExpenses += amount
          monthlyBreakdown[month].businessExpenses += amount
          if (carId !== 'no-car') {
            carBreakdown[carId].expenses += amount
          }
        }
      }
    })

    // Calculate net profit and monthly profits
    const netProfit = totalIncome - totalBusinessExpenses
    Object.keys(monthlyBreakdown).forEach(month => {
      const monthData = monthlyBreakdown[month]
      monthData.netProfit = monthData.income - monthData.businessExpenses
    })

    // Calculate car profits
    Object.keys(carBreakdown).forEach(carId => {
      const carData = carBreakdown[carId]
      carData.netProfit = carData.income - carData.expenses
    })

    // Calculate profit distribution
    const profitDistribution = {
      totalProfit: netProfit,
      investorShare: netProfit > 0 ? Math.round(netProfit * 0.5 * 100) / 100 : 0,
      ownerShare: netProfit > 0 ? Math.round(netProfit * 0.25 * 100) / 100 : 0,
      assistantShare: netProfit > 0 ? Math.round(netProfit * 0.25 * 100) / 100 : 0,
    }

    // Prepare report data
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: user.id,
          email: (profile as any)?.email,
          fullName: (profile as any)?.full_name,
          role: (profile as any)?.role,
        },
        period: {
          startDate: startDate || 'all time',
          endDate: endDate || 'present',
        },
        includePersonalExpenses,
        transactionCount: transactions?.length || 0,
      },
      summary: {
        totalIncome,
        totalBusinessExpenses,
        totalPersonalExpenses: includePersonalExpenses ? totalPersonalExpenses : undefined,
        netProfit,
        profitDistribution,
        currentCapitalState: {
          totalCapital: (capital as any)?.total_capital || 0,
          investorShare: (capital as any)?.investor_share || 0,
          ownerShare: (capital as any)?.owner_share || 0,
          assistantShare: (capital as any)?.assistant_share || 0,
          lastUpdated: (capital as any)?.updated_at,
        }
      },
      breakdowns: {
        byCategory: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category,
          ...data,
          netAmount: data.income - data.expense
        })).sort((a, b) => b.netAmount - a.netAmount),
        byMonth: Object.entries(monthlyBreakdown).map(([month, data]) => ({
          month,
          ...data
        })).sort((a, b) => a.month.localeCompare(b.month)),
        byCar: Object.entries(carBreakdown)
          .filter(([carId]) => carId !== 'no-car')
          .map(([carId, data]) => ({
            carId,
            ...data
          }))
          .sort((a, b) => b.netProfit - a.netProfit),
      },
      distributionRules: {
        investor: 50, // 50%
        owner: 25,    // 25%
        assistant: 25 // 25%
      }
    }

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json(reportData)
    }

    // Return CSV format (simplified)
    if (format === 'csv') {
      const csvHeaders = [
        'Date',
        'Type',
        'Category',
        'Amount USD',
        'Description',
        'Car VIN',
        'Is Personal',
        'User'
      ].join(',')

      const csvRows = transactions?.map(transaction => {
        const t = transaction as any
        return [
          t.date,
          t.type,
          t.category,
          t.amount_usd,
          `"${t.description || ''}"`,
          t.car?.vin || 'N/A',
          t.is_personal,
          t.user?.full_name || t.user?.email || 'Unknown'
        ].join(',')
      }) || []

      const csvContent = [csvHeaders, ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="profit-distribution-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('Error in GET /api/reports/profit-distribution:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
