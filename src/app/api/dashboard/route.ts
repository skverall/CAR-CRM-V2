import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { DashboardData, ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Get KPIs
    const { data: kpiData } = await db.rpc('get_dashboard_kpis', {
      p_org_id: orgId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    // Get top profit cars
    const { data: topProfitCars } = await db
      .from('car_profit_view')
      .select('id, vin, make, model, profit_aed, margin_pct, days_on_lot')
      .eq('org_id', orgId)
      .gte('sold_date', startDate)
      .lte('sold_date', endDate)
      .order('profit_aed', { ascending: false })
      .limit(5);

    // Get loss cars
    const { data: lossCars } = await db
      .from('car_profit_view')
      .select('id, vin, make, model, profit_aed, margin_pct, days_on_lot')
      .eq('org_id', orgId)
      .gte('sold_date', startDate)
      .lte('sold_date', endDate)
      .lt('profit_aed', 0)
      .order('profit_aed', { ascending: true })
      .limit(5);

    // Get brand distribution
    const { data: brandData } = await db.rpc('get_brand_distribution', {
      p_org_id: orgId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    const dashboardData: DashboardData = {
      kpis: kpiData?.[0] || {
        profit_total_aed: 0,
        avg_margin_pct: 0,
        median_days_to_sell: 0,
        inventory_counts: {
          in_transit: 0,
          for_sale: 0,
          reserved: 0,
          sold: 0,
          archived: 0
        }
      },
      top_profit_cars: topProfitCars || [],
      loss_cars: lossCars || [],
      brand_distribution: brandData || [],
      period_start: startDate,
      period_end: endDate
    };

    const response: ApiResponse<DashboardData> = {
      data: dashboardData,
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Create the required RPC functions
export async function POST(request: NextRequest) {
  try {
    const db = getSupabaseAdmin();
    
    // Create dashboard KPIs function
    await db.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_dashboard_kpis(
          p_org_id UUID,
          p_start_date DATE,
          p_end_date DATE
        )
        RETURNS TABLE (
          profit_total_aed DECIMAL(12,2),
          avg_margin_pct DECIMAL(5,2),
          median_days_to_sell INTEGER,
          inventory_counts JSONB
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
          v_inventory_counts JSONB;
        BEGIN
          -- Get inventory counts
          SELECT jsonb_build_object(
            'in_transit', COUNT(*) FILTER (WHERE status = 'in_transit'),
            'for_sale', COUNT(*) FILTER (WHERE status = 'for_sale'),
            'reserved', COUNT(*) FILTER (WHERE status = 'reserved'),
            'sold', COUNT(*) FILTER (WHERE status = 'sold'),
            'archived', COUNT(*) FILTER (WHERE status = 'archived')
          ) INTO v_inventory_counts
          FROM au_cars
          WHERE org_id = p_org_id;

          RETURN QUERY
          SELECT 
            COALESCE(SUM(cpv.profit_aed), 0) as profit_total_aed,
            COALESCE(AVG(cpv.margin_pct), 0) as avg_margin_pct,
            COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cpv.days_on_lot), 0)::INTEGER as median_days_to_sell,
            v_inventory_counts as inventory_counts
          FROM car_profit_view cpv
          WHERE cpv.org_id = p_org_id
            AND cpv.sold_date BETWEEN p_start_date AND p_end_date;
        END;
        $$;
      `
    });

    // Create brand distribution function
    await db.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_brand_distribution(
          p_org_id UUID,
          p_start_date DATE,
          p_end_date DATE
        )
        RETURNS TABLE (
          brand TEXT,
          count BIGINT,
          avg_profit_aed DECIMAL(12,2),
          avg_margin_pct DECIMAL(5,2)
        )
        LANGUAGE SQL
        AS $$
          SELECT 
            COALESCE(c.make, 'Unknown') as brand,
            COUNT(*) as count,
            COALESCE(AVG(cpv.profit_aed), 0) as avg_profit_aed,
            COALESCE(AVG(cpv.margin_pct), 0) as avg_margin_pct
          FROM au_cars c
          LEFT JOIN car_profit_view cpv ON c.id = cpv.id
          WHERE c.org_id = p_org_id
            AND (cpv.sold_date IS NULL OR cpv.sold_date BETWEEN p_start_date AND p_end_date)
          GROUP BY c.make
          ORDER BY count DESC, avg_profit_aed DESC;
        $$;
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Dashboard functions created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup dashboard functions',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
