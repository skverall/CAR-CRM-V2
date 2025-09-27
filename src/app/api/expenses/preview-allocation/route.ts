import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { AllocationPreview, ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, expense_amount_aed, expense_date } = body;

    if (!org_id || !expense_amount_aed || !expense_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: org_id, expense_amount_aed, expense_date',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Get current overhead rule
    const { data: currentRule } = await db.rpc('get_current_overhead_rule', {
      p_org_id: org_id
    });

    const rule = currentRule?.[0];
    if (!rule) {
      return NextResponse.json({
        success: false,
        error: 'No active overhead allocation rule found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Get preview allocation
    const { data: previewData, error } = await db.rpc('preview_overhead_allocation', {
      p_org_id: org_id,
      p_expense_amount_aed: expense_amount_aed,
      p_expense_date: expense_date
    });

    if (error) {
      throw error;
    }

    const allocationPreview: AllocationPreview = {
      expense_amount_aed,
      method: rule.method,
      allocations: (previewData || []).map((item: any) => ({
        car_vin: item.car_vin,
        car_make: item.car_make,
        car_model: item.car_model,
        allocation_ratio: item.allocation_ratio,
        allocated_amount_aed: item.allocated_amount_aed
      }))
    };

    const response: ApiResponse<AllocationPreview> = {
      data: allocationPreview,
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Allocation preview error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to preview allocation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
