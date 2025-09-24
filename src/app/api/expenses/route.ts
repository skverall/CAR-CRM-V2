import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

const createExpenseSchema = z.object({
  category: z.string().min(1, 'Категория обязательна'),
  amount: z.number().positive('Сумма должна быть положительной'),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  date: z.string(),
  carId: z.string().uuid().optional(),
  isPersonal: z.boolean().default(false),
})

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
    const category = searchParams.get('category')
    const carId = searchParams.get('carId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isPersonal = searchParams.get('isPersonal')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query for expense transactions only
    let query = (supabase as any)
      .from('transactions')
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `, { count: 'exact' })
      .eq('type' as any, 'expense' as any)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category) {
      query = query.eq('category' as any, category as any)
    }

    if (carId) {
      query = query.eq('car_id' as any, carId as any)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (isPersonal !== null) {
      query = query.eq('is_personal' as any, (isPersonal === 'true') as any)
    }

    const { data: expenseTransactions, error, count } = await query

    if (error) {
      console.error('Error fetching expense transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch expense transactions' }, { status: 500 })
    }

    // Calculate summary statistics
    const totalExpenses = expenseTransactions?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`)
    }, 0) || 0

    const businessExpenses = expenseTransactions?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return !t.is_personal ? sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`) : sum
    }, 0) || 0

    const personalExpenses = expenseTransactions?.reduce((sum: any, transaction: any) => {
      const t = transaction as any
      return t.is_personal ? sum + parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`) : sum
    }, 0) || 0

    return NextResponse.json({
      expenses: expenseTransactions,
      summary: {
        totalExpenses,
        businessExpenses,
        personalExpenses,
        transactionCount: count || 0,
        averageAmount: count ? totalExpenses / count : 0
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    if (!profile || !['owner', 'assistant'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    // Get exchange rate for the currency
    let exchangeRate = 1.0
    let amountUsd = validatedData.amount

    if (validatedData.currency !== 'USD') {
      const { data: rateData } = await (supabase as any)
        .from('exchange_rates')
        .select('rate_to_usd')
        .eq('currency' as any, validatedData.currency as any)
        .lte('date', validatedData.date)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (rateData) {
        exchangeRate = (rateData as any).rate_to_usd
        amountUsd = validatedData.amount * exchangeRate
      }
    }

    // Validate car exists if carId is provided
    if (validatedData.carId) {
      const { data: car, error: carError } = await (supabase as any)
        .from('cars')
        .select('id')
        .eq('id' as any, validatedData.carId as any)
        .single()

      if (carError || !car) {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 })
      }
    }

    // Create expense transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        type: 'expense',
        category: validatedData.category,
        amount: validatedData.amount,
        currency: validatedData.currency,
        exchange_rate: exchangeRate,
        amount_usd: amountUsd,
        description: validatedData.description,
        date: validatedData.date,
        car_id: validatedData.carId,
        user_id: user.id,
        is_personal: validatedData.isPersonal,
      } as any)
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating expense transaction:', error)
      return NextResponse.json({ error: 'Failed to create expense transaction' }, { status: 500 })
    }

    return NextResponse.json({ expense: transaction }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
