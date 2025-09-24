import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1, 'Категория обязательна').optional(),
  amount: z.number().positive('Сумма должна быть положительной').optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  carId: z.string().uuid().optional(),
  isPersonal: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: transaction, error } = await (supabase as any)
      .from('transactions')
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `)
      .eq('id' as any, params.id as any)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      console.error('Error fetching transaction:', error)
      return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error in GET /api/transactions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing transaction
    const { data: existingTransaction, error: fetchError } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('id' as any, params.id as any)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
    }

    // Check permissions
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    const canEdit = (profile as any)?.role === 'owner' ||
                   ((profile as any)?.role === 'assistant' && (existingTransaction as any).user_id === user.id)

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.category) updateData.category = validatedData.category
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.date) updateData.date = validatedData.date
    if (validatedData.carId !== undefined) updateData.car_id = validatedData.carId
    if (validatedData.isPersonal !== undefined) updateData.is_personal = validatedData.isPersonal

    // Handle amount and currency changes
    if (validatedData.amount || validatedData.currency) {
      const amount = validatedData.amount || (existingTransaction as any).amount
      const currency = validatedData.currency || (existingTransaction as any).currency
      const date = validatedData.date || (existingTransaction as any).date

      updateData.amount = amount
      updateData.currency = currency

      // Recalculate USD amount
      let exchangeRate = 1.0
      let amountUsd = amount

      if (currency !== 'USD') {
        const { data: rateData } = await (supabase as any)
          .from('exchange_rates')
          .select('rate_to_usd')
          .eq('currency' as any, currency as any)
          .lte('date', date)
          .order('date', { ascending: false })
          .limit(1)
          .single()

        if (rateData) {
          exchangeRate = (rateData as any).rate_to_usd
          amountUsd = amount * exchangeRate
        }
      }

      updateData.exchange_rate = exchangeRate
      updateData.amount_usd = amountUsd
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

    // Update transaction
    const { data: transaction, error } = await (supabase as any)
      .from('transactions')
      .update(updateData)
      .eq('id' as any, params.id as any)
      .select(`
        *,
        car:cars(id, vin, brand, model, year),
        user:users(id, email, full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/transactions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing transaction
    const { data: existingTransaction, error: fetchError } = await (supabase as any)
      .from('transactions')
      .select('user_id')
      .eq('id' as any, params.id as any)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
    }

    // Check permissions
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    const canDelete = (profile as any)?.role === 'owner' ||
                     ((profile as any)?.role === 'assistant' && (existingTransaction as any).user_id === user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete transaction
    const { error } = await (supabase as any)
      .from('transactions')
      .delete()
      .eq('id' as any, params.id as any)

    if (error) {
      console.error('Error deleting transaction:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/transactions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
