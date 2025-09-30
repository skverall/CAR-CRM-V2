import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();

    const occurred_at = formData.get('occurred_at') as string | null;
    const amount = formData.get('amount') != null ? parseFloat(String(formData.get('amount'))) : null;
    const currency = (formData.get('currency') as string | null) ?? null;
    const rate_to_aed = formData.get('rate_to_aed') != null ? parseFloat(String(formData.get('rate_to_aed'))) : null;
    const scope = (formData.get('scope') as 'car' | 'overhead' | 'personal' | null) ?? null;
    const category = (formData.get('category') as string | null) ?? null;
    const description = (formData.get('description') as string | null) ?? null;
    const car_id = (formData.get('car_id') as string | null) ?? null;

    const payload: Record<string, unknown> = {};
    if (occurred_at != null) payload.occurred_at = occurred_at;
    if (amount != null) payload.amount = amount;
    if (currency != null) payload.currency = currency;
    if (rate_to_aed != null) payload.rate_to_aed = rate_to_aed;
    if (scope != null) payload.scope = scope;
    if (category != null) payload.category = category;
    // description can be null
    if (description !== null) payload.description = description || null;
    // car_id can be null
    if (car_id !== null) payload.car_id = car_id || null;

    // recalc fils if amount or rate changed
    if (amount != null || rate_to_aed != null) {
      const amt = amount ?? 0;
      const rate = rate_to_aed ?? 1;
      payload.amount_aed_fils = Math.round(amt * rate * 100);
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db.from('au_expenses').update({ ...payload }).eq('id', id).select('*').single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update expense' }, { status: 500 });
  }
}

