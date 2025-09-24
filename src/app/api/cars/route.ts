import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createCarSchema = z.object({
  vin: z.string().length(17, 'VIN должен содержать 17 символов'),
  brand: z.string().min(1, 'Марка обязательна'),
  model: z.string().min(1, 'Модель обязательна'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string().optional(),
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
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build query
    let query = (supabase as any)
      .from('cars')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && ['active', 'sold'].includes(status)) {
      query = query.eq('status' as any, status as any)
    }

    if (search) {
      query = query.or(`vin.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data: cars, error, count } = await query

    if (error) {
      console.error('Error fetching cars:', error)
      return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
    }

    return NextResponse.json({
      cars,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/cars:', error)
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

    // Check permissions (only owner and assistant can create cars)
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
    const validatedData = createCarSchema.parse(body)

    // Check if VIN already exists
    const { data: existingCar } = await (supabase as any)
      .from('cars')
      .select('id')
      .eq('vin' as any, validatedData.vin.toUpperCase() as any)
      .single()

    if (existingCar) {
      return NextResponse.json({ error: 'Car with this VIN already exists' }, { status: 409 })
    }

    // Create car
    const { data: car, error } = await (supabase as any)
      .from('cars')
      .insert({
        vin: validatedData.vin.toUpperCase(),
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year,
        purchase_price: validatedData.purchasePrice,
        purchase_date: validatedData.purchaseDate,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating car:', error)
      return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
    }

    return NextResponse.json({ car }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in POST /api/cars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
