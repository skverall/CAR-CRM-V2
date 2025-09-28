import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CarListResponse, CarFilters, ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const sortBy = searchParams.get('sort_by') || 'purchase_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    if (!orgId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse filters
    const filters: CarFilters = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',');
    }
    if (searchParams.get('brand')) {
      filters.brand = searchParams.get('brand')!.split(',');
    }
    if (searchParams.get('only_losses') === 'true') {
      filters.only_losses = true;
    }
    if (searchParams.get('margin_min') || searchParams.get('margin_max')) {
      filters.margin_range = [
        parseFloat(searchParams.get('margin_min') || '-999'),
        parseFloat(searchParams.get('margin_max') || '999')
      ];
    }

    const db = getSupabaseAdmin();
    const offset = (page - 1) * perPage;

    // Build query
    let query = db
      .from('car_cost_view')
      .select(`
        id,
        vin,
        make,
        model,
        status,
        purchase_date,
        total_cost_aed
      `)
      .eq('org_id', orgId);

    // Apply filters
    if (filters.status) {
      query = query.in('status', filters.status);
    }
    if (filters.brand) {
      query = query.in('make', filters.brand);
    }
    // Apply sorting (fallback to purchase_date if profit/margin fields requested)
    const sortColumn = ['profit_aed','margin_pct','days_on_lot'].includes(sortBy)
      ? 'purchase_date'
      : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Get total count
    let countQuery = db
      .from('car_cost_view')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);
    if (filters.status) countQuery = countQuery.in('status', filters.status);
    if (filters.brand) countQuery = countQuery.in('make', filters.brand);

    const { count } = await countQuery;

    // Get paginated data
    const { data: carsData, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      throw error;
    }

    // Fetch related data in separate queries to avoid PostgREST FK requirements for views
    const ids = (carsData || []).map((c: Record<string, unknown>) => c.id as string);

    // au_cars fields
    let auMap: Record<string, Record<string, unknown>> = {};
    if (ids.length > 0) {
      const { data: aus } = await db
        .from('au_cars')
        .select('id, model_year, decision_tag, purchase_price_aed, sold_price_aed')
        .in('id', ids);
      auMap = (aus || []).reduce((acc: Record<string, Record<string, unknown>>, row: Record<string, unknown>) => {
        acc[row.id as string] = row;
        return acc;
      }, {} as Record<string, Record<string, unknown>>);
    }

    // car_profit_view fields
    let profitMap: Record<string, Record<string, unknown>> = {};
    if (ids.length > 0) {
      const { data: profits } = await db
        .from('car_profit_view')
        .select('id, profit_aed, margin_pct, days_on_lot, sold_price_aed')
        .in('id', ids);
      profitMap = (profits || []).reduce((acc: Record<string, Record<string, unknown>>, row: Record<string, unknown>) => {
        acc[row.id as string] = row;
        return acc;
      }, {} as Record<string, Record<string, unknown>>);
    }

    // Transform data to match API contract
    const cars = (carsData || []).map((car: Record<string, unknown>) => {
      const au = auMap[car.id as string] as Record<string, unknown> | undefined;
      const pv = profitMap[car.id as string] as Record<string, unknown> | undefined;
      return {
        id: car.id as string,
        vin: car.vin as string,
        make: car.make as string,
        model: car.model as string,
        model_year: au ? (au.model_year as number) || null : null,
        status: car.status as 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived',
        purchase_date: car.purchase_date as string,
        purchase_price_aed: au && typeof au.purchase_price_aed === 'number' ? (au.purchase_price_aed as number) / 100 : null,
        cost_base_aed: car.total_cost_aed as number,
        sold_price_aed: pv ? (pv.sold_price_aed as number) || null : (au && typeof au.sold_price_aed === 'number' ? (au.sold_price_aed as number)/100 : null),
        profit_aed: pv ? (pv.profit_aed as number) || null : null,
        margin_pct: pv ? (pv.margin_pct as number) || null : null,
        days_on_lot: pv ? (pv.days_on_lot as number) || null : null,
        decision_tag: au ? (au.decision_tag as 'take' | 'skip' | null) || null : null
      };
    });

    const response: ApiResponse<CarListResponse> = {
      data: {
        cars,
        total_count: count || 0,
        filters_applied: filters
      },
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Cars API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cars',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      vin, 
      make, 
      model, 
      model_year, 
      purchase_date, 
      purchase_price, 
      purchase_currency, 
      purchase_rate_to_aed,
      mileage,
      notes,
      org_id 
    } = body;

    if (!org_id || !vin || !purchase_date || !purchase_price || !purchase_currency || !purchase_rate_to_aed) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Convert price to fils
    const purchasePriceAedFils = Math.round(purchase_price * purchase_rate_to_aed * 100);

    const { data: carData, error } = await db
      .from('au_cars')
      .insert([{
        org_id,
        vin,
        make,
        model,
        model_year,
        purchase_date,
        purchase_price,
        purchase_currency,
        purchase_rate_to_aed,
        purchase_price_aed: purchasePriceAedFils,
        mileage,
        notes,
        status: 'in_transit'
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: carData,
      success: true,
      message: 'Car created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create car error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create car',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
