import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { TRANSACTION_CATEGORIES } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const type = searchParams.get('type') as 'income' | 'expense' | null

    // Return categories based on type
    if (type && ['income', 'expense'].includes(type)) {
      return NextResponse.json({
        categories: TRANSACTION_CATEGORIES[type],
        type
      })
    }

    // Return all categories
    return NextResponse.json({
      categories: TRANSACTION_CATEGORIES
    })
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
