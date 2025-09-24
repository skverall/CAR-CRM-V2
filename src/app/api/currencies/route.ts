import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { CURRENCIES } from '@/types'

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

    // Get current exchange rates
    const { data: exchangeRates, error: ratesError } = await supabase
      .from('exchange_rates')
      .select('currency, rate_to_usd, date')
      .order('date', { ascending: false })

    if (ratesError) {
      console.error('Error fetching exchange rates:', ratesError)
      return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }

    // Get latest rate for each currency
    const latestRates = new Map()
    exchangeRates?.forEach(rate => {
      const r = rate as any
      if (!latestRates.has(r.currency)) {
        latestRates.set(r.currency, r)
      }
    })

    // Combine currencies with their latest exchange rates
    const currenciesWithRates = CURRENCIES.map(currency => {
      const rate = latestRates.get(currency.code)
      return {
        ...currency,
        rate: rate?.rate_to_usd || 1.0,
        lastUpdated: rate?.date || null
      }
    })

    return NextResponse.json({
      currencies: currenciesWithRates
    })
  } catch (error) {
    console.error('Error in GET /api/currencies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
