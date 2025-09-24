import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

const updateCapitalSchema = z.object({
  totalCapital: z.number().optional(),
  investorShare: z.number().optional(),
  ownerShare: z.number().optional(),
  assistantShare: z.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current capital distribution
    const { data: capital, error } = await supabase
      .from('capital')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching capital:', error)
      return NextResponse.json({ error: 'Failed to fetch capital data' }, { status: 500 })
    }

    // Get profit distribution using the database function
    const { data: profitData, error: profitError } = await supabase
      .rpc('get_profit_distribution')

    if (profitError) {
      console.error('Error fetching profit distribution:', profitError)
      return NextResponse.json({ error: 'Failed to fetch profit distribution' }, { status: 500 })
    }

    // Calculate distribution percentages
    const totalProfit = (capital as any)?.total_capital || 0
    const distributionRules = {
      investor: 50, // 50%
      owner: 25,    // 25%
      assistant: 25 // 25%
    }

    return NextResponse.json({
      capital: {
        id: (capital as any)?.id,
        totalCapital: (capital as any)?.total_capital || 0,
        investorShare: (capital as any)?.investor_share || 0,
        ownerShare: (capital as any)?.owner_share || 0,
        assistantShare: (capital as any)?.assistant_share || 0,
        updatedAt: (capital as any)?.updated_at,
      },
      distributionRules,
      calculatedDistribution: (profitData as any)?.[0] || {
        total_profit: 0,
        investor_share: 0,
        owner_share: 0,
        assistant_share: 0,
      },
      isPositiveProfit: totalProfit > 0,
    })
  } catch (error) {
    console.error('Error in GET /api/capital:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only owners can manually update capital
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    if (!profile || (profile as any).role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can update capital distribution' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateCapitalSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.totalCapital !== undefined) updateData.total_capital = validatedData.totalCapital
    if (validatedData.investorShare !== undefined) updateData.investor_share = validatedData.investorShare
    if (validatedData.ownerShare !== undefined) updateData.owner_share = validatedData.ownerShare
    if (validatedData.assistantShare !== undefined) updateData.assistant_share = validatedData.assistantShare

    // Update capital
    const { data: capital, error } = await supabase
      .from('capital')
      .update(updateData)
      .order('updated_at', { ascending: false })
      .limit(1)
      .select()
      .single()

    if (error) {
      console.error('Error updating capital:', error)
      return NextResponse.json({ error: 'Failed to update capital' }, { status: 500 })
    }

    return NextResponse.json({
      capital: {
        id: (capital as any).id,
        totalCapital: (capital as any).total_capital,
        investorShare: (capital as any).investor_share,
        ownerShare: (capital as any).owner_share,
        assistantShare: (capital as any).assistant_share,
        updatedAt: (capital as any).updated_at,
      }
    })
  } catch (error) {
    console.error('Error in PUT /api/capital:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
