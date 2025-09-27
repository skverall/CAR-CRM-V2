import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CarDetails, ApiResponse } from '@/types/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await context.params;
    const db = getSupabaseAdmin();

    // Get car basic info with cost breakdown
    const { data: carData, error: carError } = await db
      .from('car_cost_view')
      .select(`
        *,
        au_cars!inner(
          model_year,
          purchase_currency,
          mileage,
          notes,
          decision_tag,
          sold_price_aed,
          sold_date,
          commission_aed
        )
      `)
      .eq('id', carId)
      .single();

    if (carError || !carData) {
      return NextResponse.json({
        success: false,
        error: 'Car not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Get profit info if car is sold
    let profitData = null;
    if (carData.status === 'sold') {
      const { data: profit } = await db
        .from('car_profit_view')
        .select('profit_aed, margin_pct, roi_pct, days_on_lot')
        .eq('id', carId)
        .single();
      profitData = profit;
    }

    // Get expenses
    const { data: expenses } = await db
      .from('au_expenses')
      .select('id, occurred_at, amount_aed, currency, category, description, attachment_id')
      .or(`car_id.eq.${carId},and(scope.in.(overhead,personal),car_id.eq.${carId})`)
      .order('occurred_at', { ascending: false });

    // Get documents
    const { data: documents } = await db
      .from('documents')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    // Get deal info if exists
    let dealData = null;
    if (carData.status === 'sold') {
      const { data: deal } = await db
        .from('deals')
        .select('*')
        .eq('car_id', carId)
        .single();
      dealData = deal;
    }

    // Build timeline
    const timeline = [];
    
    // Purchase event
    timeline.push({
      date: carData.purchase_date,
      event: 'purchase',
      description: 'Car purchased',
      amount_aed: carData.purchase_component_aed
    });

    // Expense events
    (expenses || []).forEach(expense => {
      timeline.push({
        date: expense.occurred_at,
        event: 'expense',
        description: expense.description || `${expense.category} expense`,
        amount_aed: -expense.amount_aed
      });
    });

    // Sale event
    if (carData.au_cars.sold_date) {
      timeline.push({
        date: carData.au_cars.sold_date,
        event: 'sale',
        description: 'Car sold',
        amount_aed: carData.au_cars.sold_price_aed / 100
      });
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          const { data: signedUrl } = await db.storage
            .from('car-documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry
          
          return {
            ...doc,
            signed_url: signedUrl?.signedUrl
          };
        } catch {
          return doc;
        }
      })
    );

    const carDetails: CarDetails = {
      id: carData.id,
      vin: carData.vin,
      make: carData.make,
      model: carData.model,
      model_year: carData.au_cars.model_year,
      status: carData.status,
      purchase_date: carData.purchase_date,
      purchase_price_aed: carData.purchase_component_aed,
      purchase_currency: carData.au_cars.purchase_currency,
      mileage: carData.au_cars.mileage,
      notes: carData.au_cars.notes,
      decision_tag: carData.au_cars.decision_tag,
      
      cost_breakdown: {
        purchase_component_aed: carData.purchase_component_aed,
        car_expenses_component_aed: carData.car_expenses_component_aed,
        overhead_component_aed: carData.overhead_component_aed,
        total_cost_aed: carData.total_cost_aed
      },
      
      profit_aed: profitData?.profit_aed || null,
      margin_pct: profitData?.margin_pct || null,
      roi_pct: profitData?.roi_pct || null,
      days_on_lot: profitData?.days_on_lot || null,
      
      expenses: (expenses || []).map(exp => ({
        id: exp.id,
        occurred_at: exp.occurred_at,
        amount_aed: exp.amount_aed,
        currency: exp.currency,
        category: exp.category,
        description: exp.description,
        attachment_id: exp.attachment_id
      })),
      
      documents: documentsWithUrls,
      
      deal: dealData ? {
        id: dealData.id,
        buyer_name: dealData.buyer_name,
        channel: dealData.channel,
        sold_price_aed: dealData.sold_price_aed / 100, // Convert from fils
        sold_date: dealData.sold_date,
        commission_aed: dealData.commission_aed / 100, // Convert from fils
        agent_id: dealData.agent_id
      } : null,
      
      timeline
    };

    const response: ApiResponse<CarDetails> = {
      data: carDetails,
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Car details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch car details',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await context.params;
    const body = await request.json();
    const db = getSupabaseAdmin();

    // Update car
    const { data: updatedCar, error } = await db
      .from('au_cars')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', carId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: updatedCar,
      success: true,
      message: 'Car updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update car error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update car',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
