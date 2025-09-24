import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only owners can trigger recalculation
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id' as any, user.id as any)
      .single()

    if (!profile || (profile as any).role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can trigger profit recalculation' }, { status: 403 })
    }

    // Calculate totals from transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('type, amount_usd, is_personal')

    if (transactionError) {
      console.error('Error fetching transactions for recalculation:', transactionError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Calculate income and expenses
    let totalIncome = 0
    let totalExpenses = 0

    transactions?.forEach(transaction => {
      const t = transaction as any
      const amount = parseFloat(t.amount_usd?.toString?.() ?? `${t.amount_usd ?? 0}`)

      if (t.type === 'income') {
        totalIncome += amount
      } else if (t.type === 'expense' && !t.is_personal) {
        totalExpenses += amount
      }
    })

    // Calculate net profit
    const netProfit = totalIncome - totalExpenses

    // Calculate profit distribution according to the rules
    let investorShare = 0
    let ownerShare = 0
    let assistantShare = 0

    if (netProfit > 0) {
      investorShare = Math.round(netProfit * 0.5 * 100) / 100 // 50%
      const remainingProfit = netProfit - investorShare
      ownerShare = Math.round(remainingProfit * 0.5 * 100) / 100 // 25%
      assistantShare = Math.round(remainingProfit * 0.5 * 100) / 100 // 25%
    }

    // Update capital table
    const { data: capital, error: updateError } = await supabase
      .from('capital')
      .update({
        total_capital: netProfit,
        investor_share: investorShare,
        owner_share: ownerShare,
        assistant_share: assistantShare,
        updated_at: new Date().toISOString(),
      } as any)
      .order('updated_at', { ascending: false })
      .limit(1)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating capital during recalculation:', updateError)
      return NextResponse.json({ error: 'Failed to update capital' }, { status: 500 })
    }

    // Log the recalculation in audit log
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'RECALCULATE',
        table_name: 'capital',
        record_id: (capital as any).id,
        old_values: null,
        new_values: {
          total_capital: netProfit,
          investor_share: investorShare,
          owner_share: ownerShare,
          assistant_share: assistantShare,
          recalculation_trigger: 'manual',
          transaction_count: transactions?.length || 0,
          total_income: totalIncome,
          total_expenses: totalExpenses,
        },
      } as any)

    if (auditError) {
      console.error('Error logging recalculation:', auditError)
      // Don't fail the request for audit log errors
    }

    return NextResponse.json({
      success: true,
      message: 'Profit distribution recalculated successfully',
      recalculation: {
        totalIncome,
        totalExpenses,
        netProfit,
        investorShare,
        ownerShare,
        assistantShare,
        transactionCount: transactions?.length || 0,
        recalculatedAt: (capital as any).updated_at,
      },
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
    console.error('Error in POST /api/capital/recalculate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
