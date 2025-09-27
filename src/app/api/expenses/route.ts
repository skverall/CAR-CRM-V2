import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ExpenseInput, ExpenseResponse, ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const carId = searchParams.get('car_id');
    const scope = searchParams.get('scope');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');

    if (!orgId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const offset = (page - 1) * perPage;

    let query = db
      .from('au_expenses')
      .select(`
        id,
        occurred_at,
        amount_aed,
        scope,
        category,
        description,
        car_id,
        au_cars(vin)
      `)
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false });

    if (carId) {
      query = query.eq('car_id', carId);
    }
    if (scope) {
      query = query.eq('scope', scope);
    }

    const { data: expenses, error } = await query
      .range(offset, offset + perPage - 1);

    if (error) {
      throw error;
    }

    const response: ApiResponse<ExpenseResponse[]> = {
      data: (expenses || []).map((exp: Record<string, unknown>) => ({
        id: exp.id as string,
        occurred_at: exp.occurred_at as string,
        amount_aed: exp.amount_aed as number,
        scope: exp.scope as string,
        category: exp.category as string,
        description: exp.description as string,
        car_vin: (exp.au_cars as Record<string, unknown>)?.vin as string || null
      })),
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Expenses API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch expenses',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const expenseData: ExpenseInput = {
      occurred_at: formData.get('occurred_at') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string,
      rate_to_aed: parseFloat(formData.get('rate_to_aed') as string),
      scope: formData.get('scope') as 'car' | 'overhead' | 'personal',
      category: formData.get('category') as ExpenseInput['category'],
      description: formData.get('description') as string || undefined,
      car_id: formData.get('car_id') as string || undefined,
      attachment_file: formData.get('attachment') as File || undefined
    };

    const orgId = formData.get('org_id') as string;

    if (!orgId || !expenseData.occurred_at || !expenseData.amount || !expenseData.currency || !expenseData.rate_to_aed || !expenseData.scope || !expenseData.category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate car_id for car expenses
    if (expenseData.scope === 'car' && !expenseData.car_id) {
      return NextResponse.json({
        success: false,
        error: 'Car ID is required for car expenses',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    let attachmentId = null;

    // Handle file upload if present
    if (expenseData.attachment_file && expenseData.attachment_file.size > 0) {
      const file = expenseData.attachment_file;
      const fileName = `${orgId}/${expenseData.car_id || 'general'}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await db.storage
        .from('car-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
      } else {
        // Create document record
        const { data: docData } = await db
          .from('documents')
          .insert([{
            org_id: orgId,
            car_id: expenseData.car_id || null,
            file_path: uploadData.path,
            mime_type: file.type,
            file_size: file.size,
            original_name: file.name
          }])
          .select()
          .single();
        
        attachmentId = docData?.id;
      }
    }

    // Convert amount to fils
    const amountAedFils = Math.round(expenseData.amount * expenseData.rate_to_aed * 100);

    // Create expense
    const { data: expenseRecord, error } = await db
      .from('au_expenses')
      .insert([{
        org_id: orgId,
        occurred_at: expenseData.occurred_at,
        amount: expenseData.amount,
        currency: expenseData.currency,
        rate_to_aed: expenseData.rate_to_aed,
        amount_aed_fils: amountAedFils,
        scope: expenseData.scope,
        category: expenseData.category,
        description: expenseData.description,
        car_id: expenseData.car_id,
        attachment_id: attachmentId
      }])
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
      .single();

    if (error) {
      throw error;
    }

    // Get allocation preview for overhead/personal expenses
    let allocationPreview = null;
    if (expenseData.scope in ['overhead', 'personal']) {
      const { data: preview } = await db.rpc('preview_overhead_allocation', {
        p_org_id: orgId,
        p_expense_amount_aed: expenseData.amount * expenseData.rate_to_aed,
        p_expense_date: expenseData.occurred_at
      });

      if (preview && preview.length > 0) {
        const { data: currentRule } = await db.rpc('get_current_overhead_rule', {
          p_org_id: orgId
        });

        allocationPreview = {
          method: currentRule?.[0]?.method || 'per_car',
          affected_cars: preview.map((p: Record<string, unknown>) => ({
            vin: p.car_vin as string,
            allocation_ratio: p.allocation_ratio as number,
            allocated_amount_aed: p.allocated_amount_aed as number
          }))
        };
      }
    }

    const response: ApiResponse<ExpenseResponse> = {
      data: {
        id: expenseRecord.id,
        occurred_at: expenseRecord.occurred_at,
        amount_aed: expenseRecord.amount_aed_fils / 100,
        scope: expenseRecord.scope,
        category: expenseRecord.category,
        description: expenseRecord.description,
        car_vin: expenseRecord.au_cars?.vin || null,
        allocation_preview: allocationPreview
      },
      success: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create expense',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
