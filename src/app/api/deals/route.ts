import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { DealInput, DealResponse, ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dealData: DealInput = body;

    if (!dealData.car_id || !dealData.sold_price_aed || !dealData.sold_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: car_id, sold_price_aed, sold_date',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Start transaction
    const { data: carData, error: carError } = await db
      .from('au_cars')
      .select('id, org_id, status, purchase_date')
      .eq('id', dealData.car_id)
      .single();

    if (carError || !carData) {
      return NextResponse.json({
        success: false,
        error: 'Car not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    if (carData.status === 'sold') {
      return NextResponse.json({
        success: false,
        error: 'Car is already sold',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Convert prices to fils
    const soldPriceAedFils = Math.round(dealData.sold_price_aed * 100);
    const commissionAedFils = Math.round((dealData.commission_aed || 0) * 100);

    // Create deal record
    const { data: deal, error: dealError } = await db
      .from('deals')
      .insert([{
        org_id: carData.org_id,
        car_id: dealData.car_id,
        buyer_name: dealData.buyer_name,
        channel: dealData.channel,
        sold_price_aed: soldPriceAedFils,
        sold_date: dealData.sold_date,
        commission_aed: commissionAedFils,
        agent_id: dealData.agent_id
      }])
      .select()
      .single();

    if (dealError) {
      throw dealError;
    }

    // Update car status and sale info
    const { error: updateError } = await db
      .from('au_cars')
      .update({
        status: 'sold',
        sold_price_aed: soldPriceAedFils,
        sold_date: dealData.sold_date,
        commission_aed: commissionAedFils,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealData.car_id);

    if (updateError) {
      throw updateError;
    }

    // Create sale income record (for consistency with existing system)
    const { error: incomeError } = await db
      .from('au_incomes')
      .insert([{
        occurred_at: dealData.sold_date,
        amount: dealData.sold_price_aed,
        currency: 'AED',
        rate_to_aed: 1,
        amount_aed: soldPriceAedFils,
        description: '[SALE] Auto sale',
        car_id: dealData.car_id
      }]);

    if (incomeError) {
      console.warn('Failed to create income record:', incomeError);
    }

    // Calculate profit metrics
    const { data: profitData } = await db
      .from('car_profit_view')
      .select('profit_aed, margin_pct, roi_pct, days_on_lot')
      .eq('id', dealData.car_id)
      .single();

    const response: ApiResponse<DealResponse> = {
      data: {
        id: deal.id,
        car_id: dealData.car_id,
        profit_aed: profitData?.profit_aed || 0,
        margin_pct: profitData?.margin_pct || 0,
        roi_pct: profitData?.roi_pct || 0,
        days_on_lot: profitData?.days_on_lot || 0,
        updated_car_status: 'sold'
      },
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create deal',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const carId = searchParams.get('car_id');

    if (!orgId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    let query = db
      .from('deals')
      .select(`
        id,
        car_id,
        buyer_name,
        channel,
        sold_price_aed,
        sold_date,
        commission_aed,
        agent_id,
        au_cars(vin, make, model)
      `)
      .eq('org_id', orgId)
      .order('sold_date', { ascending: false });

    if (carId) {
      query = query.eq('car_id', carId);
    }

    const { data: deals, error } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<Array<Record<string, unknown>>> = {
      data: (deals || []).map((deal: Record<string, unknown>) => ({
        id: deal.id as string,
        car_id: deal.car_id as string,
        car_vin: (deal.au_cars as Record<string, unknown>)?.vin as string,
        car_make: (deal.au_cars as Record<string, unknown>)?.make as string,
        car_model: (deal.au_cars as Record<string, unknown>)?.model as string,
        buyer_name: deal.buyer_name as string,
        channel: deal.channel as string,
        sold_price_aed: (deal.sold_price_aed as number) / 100, // Convert from fils
        sold_date: deal.sold_date as string,
        commission_aed: (deal.commission_aed as number) / 100, // Convert from fils
        agent_id: deal.agent_id as string
      })),
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Deals API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch deals',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
