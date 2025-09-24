import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

const createExchangeRateSchema = z.object({
  currency: z.string().min(3).max(3),
  rate: z.number().positive('Курс должен быть положительным'),
  date: z.string(),
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
    const currency = searchParams.get('currency')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    // Apply filters
    if (currency) {
      query = query.eq('currency' as any, currency.toUpperCase() as any)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: rates, error } = await query

    if (error) {
      console.error('Error fetching exchange rates:', error)
      return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }

    return NextResponse.json({
      rates: rates || []
    })
  } catch (error) {
    console.error('Error in GET /api/exchange-rates:', error)
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

    // Check permissions - only owners can manage exchange rates
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    if (!profile || (profile as any).role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createExchangeRateSchema.parse(body)

    // Create or update exchange rate
    const { data: rate, error } = await supabase
      .from('exchange_rates')
      .upsert({
        currency: validatedData.currency.toUpperCase(),
        rate_to_usd: validatedData.rate,
        date: validatedData.date,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating exchange rate:', error)
      return NextResponse.json({ error: 'Failed to create exchange rate' }, { status: 500 })
    }

    return NextResponse.json({ rate }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/exchange-rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
