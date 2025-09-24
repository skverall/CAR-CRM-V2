import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
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
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const carId = searchParams.get('carId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isPersonal = searchParams.get('isPersonal')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = (supabase as any)
      .from('transactions')
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type && ['income', 'expense'].includes(type)) {
      query = query.eq('type' as any, type as any)
    }

    if (category) {
      query = query.eq('category' as any, category as any)
    }

    if (carId) {
      query = query.eq('car_id' as any, carId as any)
    }

    if (startDate) {
      query = query.gte('date' as any, startDate as any)
    }

    if (endDate) {
      query = query.lte('date' as any, endDate as any)
    }

    if (isPersonal !== null) {
      query = query.eq('is_personal' as any, (isPersonal === 'true') as any)
    }

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/transactions:', error)
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
    const validatedData = createTransactionSchema.parse(body)

    // Get exchange rate for the currency
    let exchangeRate = 1.0
    let amountUsd = validatedData.amount

    if (validatedData.currency !== 'USD') {
      const { data: rateData } = await (supabase as any)
        .from('exchange_rates')
        .select('rate_to_usd')
        .eq('currency' as any, validatedData.currency as any)
        .lte('date' as any, validatedData.date as any)
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

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        type: validatedData.type as any,
        category: validatedData.category as any,
        amount: validatedData.amount as any,
        currency: validatedData.currency as any,
        exchange_rate: exchangeRate as any,
        amount_usd: amountUsd as any,
        description: (validatedData.description as any),
        date: validatedData.date as any,
        car_id: (validatedData.carId as any),
        user_id: user.id as any,
        is_personal: validatedData.isPersonal as any,
      } as any)
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in POST /api/transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
