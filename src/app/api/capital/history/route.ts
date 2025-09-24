import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

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
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get capital history from audit log
    let auditQuery = (supabase as any)
      .from('audit_log')
      .select(`
        id,
        user_id,
        action,
        old_values,
        new_values,
        created_at,
        user:users(id, email, full_name, role)
      `)
      .eq('table_name' as any, 'capital' as any)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply date filters
    if (startDate) {
      auditQuery = auditQuery.gte('created_at', startDate)
    }

    if (endDate) {
      auditQuery = auditQuery.lte('created_at', endDate)
    }

    const { data: auditHistory, error: auditError } = await auditQuery

    if (auditError) {
      console.error('Error fetching capital history:', auditError)
      return NextResponse.json({ error: 'Failed to fetch capital history' }, { status: 500 })
    }

    // Get current capital state
    const { data: currentCapital, error: capitalError } = await supabase
      .from('capital')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (capitalError) {
      console.error('Error fetching current capital:', capitalError)
      return NextResponse.json({ error: 'Failed to fetch current capital' }, { status: 500 })
    }

    // Format history entries
    const formattedHistory = auditHistory?.map((entry: any) => {
      const e = entry as any
      const oldValues = e.old_values as any
      const newValues = e.new_values as any

      return {
        id: e.id,
        action: e.action,
        timestamp: e.created_at,
        user: e.user ? {
          id: e.user.id,
          email: e.user.email,
          fullName: e.user.full_name,
          role: e.user.role,
        } : null,
        changes: {
          before: oldValues ? {
            totalCapital: oldValues.total_capital || 0,
            investorShare: oldValues.investor_share || 0,
            ownerShare: oldValues.owner_share || 0,
            assistantShare: oldValues.assistant_share || 0,
          } : null,
          after: newValues ? {
            totalCapital: newValues.total_capital || 0,
            investorShare: newValues.investor_share || 0,
            ownerShare: newValues.owner_share || 0,
            assistantShare: newValues.assistant_share || 0,
          } : null,
        },
        metadata: newValues ? {
          recalculationTrigger: newValues.recalculation_trigger,
          transactionCount: newValues.transaction_count,
          totalIncome: newValues.total_income,
          totalExpenses: newValues.total_expenses,
        } : null,
      }
    }) || []

    // Calculate summary statistics
    const summary = {
      totalEntries: formattedHistory.length,
      currentState: {
        totalCapital: (currentCapital as any)?.total_capital || 0,
        investorShare: (currentCapital as any)?.investor_share || 0,
        ownerShare: (currentCapital as any)?.owner_share || 0,
        assistantShare: (currentCapital as any)?.assistant_share || 0,
        lastUpdated: (currentCapital as any)?.updated_at,
      },
      distributionRules: {
        investor: 50, // 50%
        owner: 25,    // 25%
        assistant: 25 // 25%
      }
    }

    return NextResponse.json({
      history: formattedHistory,
      summary,
      pagination: {
        limit,
        total: formattedHistory.length,
        hasMore: formattedHistory.length === limit,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/capital/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
