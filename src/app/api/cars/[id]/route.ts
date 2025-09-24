import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

const updateCarSchema = z.object({
  vin: z.string().length(17, 'VIN должен содержать 17 символов').optional(),
  brand: z.string().min(1, 'Марка обязательна').optional(),
  model: z.string().min(1, 'Модель обязательна').optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: z.enum(['active', 'sold']).optional(),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string().optional(),
  salePrice: z.number().optional(),
  saleDate: z.string().optional(),
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

    const { data: car, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 })
      }
      console.error('Error fetching car:', error)
      return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error('Error in GET /api/cars/[id]:', error)
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

    // Check permissions
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'assistant'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateCarSchema.parse(body)

    // Check if car exists
    const { data: existingCar, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 })
    }

    // If VIN is being updated, check for duplicates
    if (validatedData.vin && validatedData.vin !== existingCar.vin) {
      const { data: duplicateCar } = await supabase
        .from('cars')
        .select('id')
        .eq('vin', validatedData.vin.toUpperCase())
        .neq('id', params.id)
        .single()

      if (duplicateCar) {
        return NextResponse.json({ error: 'Car with this VIN already exists' }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.vin) updateData.vin = validatedData.vin.toUpperCase()
    if (validatedData.brand) updateData.brand = validatedData.brand
    if (validatedData.model) updateData.model = validatedData.model
    if (validatedData.year) updateData.year = validatedData.year
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.purchasePrice !== undefined) updateData.purchase_price = validatedData.purchasePrice
    if (validatedData.purchaseDate !== undefined) updateData.purchase_date = validatedData.purchaseDate
    if (validatedData.salePrice !== undefined) updateData.sale_price = validatedData.salePrice
    if (validatedData.saleDate !== undefined) updateData.sale_date = validatedData.saleDate

    // Update car
    const { data: car, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating car:', error)
      return NextResponse.json({ error: 'Failed to update car' }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/cars/[id]:', error)
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

    // Check permissions (only owner can delete cars)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if car has transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('car_id', params.id)
      .limit(1)

    if (transactionError) {
      console.error('Error checking transactions:', transactionError)
      return NextResponse.json({ error: 'Failed to check car transactions' }, { status: 500 })
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete car with existing transactions' 
      }, { status: 409 })
    }

    // Delete car
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting car:', error)
      return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/cars/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
