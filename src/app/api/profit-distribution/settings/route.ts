import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const distributionSettingsSchema = z.object({
  investorPercentage: z.number().min(0).max(100),
  ownerPercentage: z.number().min(0).max(100),
  assistantPercentage: z.number().min(0).max(100),
}).refine(
  (data) => data.investorPercentage + data.ownerPercentage + data.assistantPercentage === 100,
  {
    message: "Percentages must sum to 100",
    path: ["percentages"],
  }
)

// For now, we'll store settings in a simple table or use default values
// In a real application, you might want to create a settings table
const DEFAULT_DISTRIBUTION = {
  investorPercentage: 50,
  ownerPercentage: 25,
  assistantPercentage: 25,
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return default settings
    // In a real implementation, you would fetch from a settings table
    const settings = {
      distributionRules: DEFAULT_DISTRIBUTION,
      isCustomizable: true,
      lastModified: null,
      modifiedBy: null,
    }

    // Get current profit to show what the distribution would be
    const { data: profitData, error: profitError } = await supabase
      .rpc('get_profit_distribution')

    if (profitError) {
      console.error('Error fetching current profit:', profitError)
      return NextResponse.json({ error: 'Failed to fetch current profit' }, { status: 500 })
    }

    const currentProfit = (profitData as any)?.[0]?.total_profit || 0

    // Calculate what the distribution would be with current settings
    const projectedDistribution = {
      totalProfit: currentProfit,
      investorShare: Math.round(currentProfit * (DEFAULT_DISTRIBUTION.investorPercentage / 100) * 100) / 100,
      ownerShare: Math.round(currentProfit * (DEFAULT_DISTRIBUTION.ownerPercentage / 100) * 100) / 100,
      assistantShare: Math.round(currentProfit * (DEFAULT_DISTRIBUTION.assistantPercentage / 100) * 100) / 100,
    }

    return NextResponse.json({
      settings,
      projectedDistribution,
      currentProfit,
    })
  } catch (error) {
    console.error('Error in GET /api/profit-distribution/settings:', error)
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

    // Check permissions - only owners can change distribution settings
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    if (!profile || (profile as any).role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can modify profit distribution settings' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = distributionSettingsSchema.parse(body)

    // For now, we'll just return success since we're using fixed percentages
    // In a real implementation, you would:
    // 1. Store the new settings in a settings table
    // 2. Update the database functions to use dynamic percentages
    // 3. Recalculate existing capital distribution if needed

    // Log the settings change in audit log
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'UPDATE_DISTRIBUTION_SETTINGS',
        table_name: 'profit_distribution_settings',
        record_id: 'default',
        old_values: {
          investor_percentage: DEFAULT_DISTRIBUTION.investorPercentage,
          owner_percentage: DEFAULT_DISTRIBUTION.ownerPercentage,
          assistant_percentage: DEFAULT_DISTRIBUTION.assistantPercentage,
        },
        new_values: {
          investor_percentage: validatedData.investorPercentage,
          owner_percentage: validatedData.ownerPercentage,
          assistant_percentage: validatedData.assistantPercentage,
          changed_by: user.id,
          change_reason: 'Manual settings update',
        },
      } as any)

    if (auditError) {
      console.error('Error logging settings change:', auditError)
      // Don't fail the request for audit log errors
    }

    // Get current profit for projection
    const { data: profitData, error: profitError } = await supabase
      .rpc('get_profit_distribution')

    const currentProfit = (profitData as any)?.[0]?.total_profit || 0

    // Calculate projected distribution with new settings
    const projectedDistribution = {
      totalProfit: currentProfit,
      investorShare: Math.round(currentProfit * (validatedData.investorPercentage / 100) * 100) / 100,
      ownerShare: Math.round(currentProfit * (validatedData.ownerPercentage / 100) * 100) / 100,
      assistantShare: Math.round(currentProfit * (validatedData.assistantPercentage / 100) * 100) / 100,
    }

    return NextResponse.json({
      success: true,
      message: 'Distribution settings updated successfully',
      settings: {
        distributionRules: {
          investorPercentage: validatedData.investorPercentage,
          ownerPercentage: validatedData.ownerPercentage,
          assistantPercentage: validatedData.assistantPercentage,
        },
        lastModified: new Date().toISOString(),
        modifiedBy: user.id,
      },
      projectedDistribution,
      note: 'Settings have been logged. In a production system, this would update the calculation functions and recalculate existing distributions.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/profit-distribution/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
