import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    // Default range = today (local server time)
    const today = new Date();
    const start = searchParams.get('start') || toISODate(today);
    const end = searchParams.get('end') || toISODate(today);

    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data: rows, error } = await db
      .from('au_expenses')
      .select(`
        id,
        occurred_at,
        amount_aed_fils,
        scope,
        category,
        description,
        car_id,
        au_cars(vin)
      `)
      .eq('org_id', orgId)
      .gte('occurred_at', start)
      .lte('occurred_at', end)
      .order('occurred_at', { ascending: true });

    if (error) throw error;

    type Row = {
      id: string;
      occurred_at: string;
      amount_aed_fils: number | null;
      scope: 'car' | 'overhead' | 'personal';
      category: string;
      description: string | null;
      car_id: string | null;
      au_cars: { vin?: string } | { vin?: string }[] | null;
    };

    const items = (rows as Row[] | null || []).map((r) => {
      const au = r.au_cars as { vin?: string } | { vin?: string }[] | null;
      const vin = Array.isArray(au) ? (au[0]?.vin ?? null) : (au?.vin ?? null);
      const amount_aed = typeof r.amount_aed_fils === 'number' ? r.amount_aed_fils / 100 : 0;
      return {
        id: r.id,
        occurred_at: r.occurred_at,
        amount_aed,
        scope: r.scope,
        category: r.category,
        description: r.description,
        car_vin: vin,
      };
    });

    const by = {
      category: new Map<string, number>(),
      scope: new Map<string, number>(),
      car: new Map<string, number>(),
    };

    let total_aed = 0;
    for (const it of items) {
      total_aed += it.amount_aed;
      by.category.set(it.category, (by.category.get(it.category) || 0) + it.amount_aed);
      by.scope.set(it.scope, (by.scope.get(it.scope) || 0) + it.amount_aed);
      const carKey = it.car_vin || (it.scope === 'personal' ? 'PERSONAL' : it.scope.toUpperCase());
      by.car.set(carKey, (by.car.get(carKey) || 0) + it.amount_aed);
    }

    const summarize = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([k, v]) => ({ key: k, total_aed: Number(v.toFixed(2)) }))
        .sort((a, b) => b.total_aed - a.total_aed);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        range: { start, end },
        summary: {
          total_aed: Number(total_aed.toFixed(2)),
          by_category: summarize(by.category),
          by_scope: summarize(by.scope),
          by_car: summarize(by.car),
        },
        items,
      }
    });
  } catch (error) {
    console.error('Daily expenses API error', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to build daily expenses report',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

