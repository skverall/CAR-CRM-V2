import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE;
if (!url || !service) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const db = createClient(url, service);

async function main() {
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const vin = `SEEDVIN-${now.getTime()}`;

  const car = {
    vin,
    make: 'Toyota',
    model: 'Corolla',
    model_year: 2018,
    source: 'seed-script',
    purchase_date: date,
    purchase_currency: 'USD',
    purchase_rate_to_aed: 3.67,
    purchase_price: 5000,
    status: 'available',
  };

  const { data: carRows, error: carErr } = await db.from('au_cars').insert([car]).select('id');
  if (carErr || !carRows?.[0]) throw new Error(carErr?.message || 'Car insert failed');
  const carId = carRows[0].id;
  console.log('Inserted car', carId, vin);

  const { error: expErr } = await db.from('au_expenses').insert([
    { occurred_at: date, amount: 300, currency: 'USD', rate_to_aed: 3.67, expense_type: 'shipping', description: 'seed' , car_id: carId, is_personal_or_general: false },
    { occurred_at: date, amount: 800, currency: 'USD', rate_to_aed: 3.67, expense_type: 'repair', description: 'seed' , car_id: carId, is_personal_or_general: false },
    { occurred_at: date, amount: 1000, currency: 'AED', rate_to_aed: 1, expense_type: 'office', description: 'general seed', is_personal_or_general: true, general_account: 'business' },
  ]);
  if (expErr) throw new Error('Expenses insert failed: ' + expErr.message);

  const { error: incErr } = await db.from('au_incomes').insert([
    { occurred_at: date, amount: 21000, currency: 'AED', rate_to_aed: 1, description: 'sale', car_id: carId },
  ]);
  if (incErr) throw new Error('Incomes insert failed: ' + incErr.message);

  const { error: updErr } = await db.from('au_cars').update({ status: 'sold' }).eq('id', carId);
  if (updErr) throw new Error('Update car status failed: ' + updErr.message);

  try {
    await db.rpc('au_distribute_profit', { p_car_id: carId });
    console.log('Profit distribution attempted.');
  } catch (e) {
    console.warn('Distribution RPC failed (may not exist):', e?.message || e);
  }

  console.log('Seed complete for car', carId);
}

main().catch((e) => {
  console.error('Seed error:', e?.message || e);
  process.exit(1);
});

