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
    const carId = searchParams.get('carId')
    const isPersonal = searchParams.get('isPersonal')

    // Build base query for transactions
    let baseQuery = supabase
      .from('transactions')
      .select('type, amount_usd, is_personal, car_id, date, category')

    // Apply filters
    if (startDate) {
      baseQuery = baseQuery.gte('date', startDate)
    }

    if (endDate) {
      baseQuery = baseQuery.lte('date', endDate)
    }

    if (carId) {
      baseQuery = baseQuery.eq('car_id', carId)
    }

    if (isPersonal !== null) {
      baseQuery = baseQuery.eq('is_personal', isPersonal === 'true')
    }

    const { data: transactions, error } = await baseQuery

    if (error) {
      console.error('Error fetching transactions for stats:', error)
      return NextResponse.json({ error: 'Failed to fetch transaction stats' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      businessIncome: 0,
      businessExpenses: 0,
      personalExpenses: 0,
      netProfit: 0,
      transactionCount: transactions?.length || 0,
      incomeTransactions: 0,
      expenseTransactions: 0,
      categoryBreakdown: {} as Record<string, { income: number, expense: number }>,
      monthlyBreakdown: {} as Record<string, { income: number, expense: number, profit: number }>
    }

    transactions?.forEach(transaction => {
      const amount = parseFloat(transaction.amount_usd.toString())
      const month = transaction.date.substring(0, 7) // YYYY-MM format

      // Initialize monthly breakdown if not exists
      if (!stats.monthlyBreakdown[month]) {
        stats.monthlyBreakdown[month] = { income: 0, expense: 0, profit: 0 }
      }

      // Initialize category breakdown if not exists
      if (!stats.categoryBreakdown[transaction.category]) {
        stats.categoryBreakdown[transaction.category] = { income: 0, expense: 0 }
      }

      if (transaction.type === 'income') {
        stats.totalIncome += amount
        stats.businessIncome += amount
        stats.incomeTransactions++
        stats.monthlyBreakdown[month].income += amount
        stats.categoryBreakdown[transaction.category].income += amount
      } else if (transaction.type === 'expense') {
        stats.totalExpenses += amount
        stats.expenseTransactions++
        stats.monthlyBreakdown[month].expense += amount
        stats.categoryBreakdown[transaction.category].expense += amount

        if (transaction.is_personal) {
          stats.personalExpenses += amount
        } else {
          stats.businessExpenses += amount
        }
      }
    })

    // Calculate net profit and monthly profits
    stats.netProfit = stats.businessIncome - stats.businessExpenses
    Object.keys(stats.monthlyBreakdown).forEach(month => {
      const monthData = stats.monthlyBreakdown[month]
      monthData.profit = monthData.income - monthData.expense
    })

    // Get top categories by amount
    const topCategories = Object.entries(stats.categoryBreakdown)
      .map(([category, data]) => ({
        category,
        totalAmount: data.income + data.expense,
        income: data.income,
        expense: data.expense
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // Get monthly trends (sorted by month)
    const monthlyTrends = Object.entries(stats.monthlyBreakdown)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      summary: {
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        businessIncome: stats.businessIncome,
        businessExpenses: stats.businessExpenses,
        personalExpenses: stats.personalExpenses,
        netProfit: stats.netProfit,
        transactionCount: stats.transactionCount,
        incomeTransactions: stats.incomeTransactions,
        expenseTransactions: stats.expenseTransactions
      },
      topCategories,
      monthlyTrends,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        carId: carId || 'all',
        isPersonal: isPersonal || 'all'
      }
    })
  } catch (error) {
    console.error('Error in GET /api/transactions/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
