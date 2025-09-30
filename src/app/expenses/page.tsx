import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import Text from "@/app/components/i18n/Text";
import ExpensesClientTable from "@/app/components/table/ExpensesClientTable";
import QuickAddExpense from "@/app/components/quick/QuickAddExpense";

export const dynamic = "force-dynamic";


async function getOrgId(): Promise<string> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? "";
}

async function addExpense(formData: FormData) {
  "use server";
  const db = getSupabaseAdmin();
  const orgId = await getOrgId();

  const occurredAt = String(formData.get("occurred_at"));
  const amount = parseFloat(String(formData.get("amount")));
  const currency = String(formData.get("currency"));
  const rateToAed = parseFloat(String(formData.get("rate_to_aed")));
  const category = String(formData.get("category"));
  const description = String(formData.get("description") || "");
  const carId = String(formData.get("car_id") || "");
  const scope = carId ? "car" : "overhead";

  if (!occurredAt || !isFinite(amount) || !currency || !isFinite(rateToAed) || !category) {
    throw new Error("Invalid form data");
  }

  const amountAedFils = Math.round(amount * rateToAed * 100);

  const { error } = await db.from("au_expenses").insert([{
    org_id: orgId,
    occurred_at: occurredAt,
    amount,
    currency,
    rate_to_aed: rateToAed,
    amount_aed_fils: amountAedFils,
    scope,
    category,
    description: description || null,
    car_id: carId || null,
  }]);

  if (error) {
    console.error("addExpense insert error", error);
    throw new Error("Failed to add expense");
  }

  redirect("/expenses");
}

export default async function ExpensesPage({ searchParams }: { searchParams?: { car_id?: string; quick?: string; from?: string; to?: string; cat?: string; q?: string } }) {
  const orgId = await getOrgId();
  const db = getSupabaseAdmin();

  const from = searchParams?.from || undefined;
  const to = searchParams?.to || undefined;
  const cat = searchParams?.cat || undefined;
  const q = searchParams?.q || undefined;

  // Fetch filtered expenses
  let expQuery = db
    .from("au_expenses")
    .select("*")
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false });
  if (from) expQuery = expQuery.gte("occurred_at", from);
  if (to)   expQuery = expQuery.lte("occurred_at", to);
  if (cat)  expQuery = expQuery.eq("category", cat);
  if (q)    expQuery = expQuery.ilike("description", `%${q}%`);
  const { data: expenses } = await expQuery;

  // Fetch all cars for the dropdown and mapping
  const { data: cars } = await db
    .from("au_cars")
    .select("id, vin")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("vin");

  const carRefs = (cars || []).map((c) => ({ id: c.id, vin: c.vin }));
  const carMap = Object.fromEntries(carRefs.map(c => [c.id, c.vin]));

  const expenseRows = (expenses || []).map((exp) => ({
    id: exp.id,
    occurred_at: exp.occurred_at,
    amount: exp.amount,
    currency: exp.currency,
    rate_to_aed: exp.rate_to_aed,
    amount_aed_fils: exp.amount_aed_fils,
    category: exp.category,
    description: exp.description,
    car_id: exp.car_id,
    car_label: exp.car_id ? (carMap[exp.car_id] || exp.car_id) : '',
    scope: exp.scope,
  }));

  // Calculate summary statistics
  const totalAed = expenseRows.reduce((sum, exp) => {
    return sum + (exp.amount_aed_fils ? exp.amount_aed_fils / 100 : 0);
  }, 0);

  const byCategory = expenseRows.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    acc[cat] = (acc[cat] || 0) + (exp.amount_aed_fils ? exp.amount_aed_fils / 100 : 0);
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            <Text path="expenses.title" fallback="Xarajatlar" />
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <Text path="expenses.subtitle" fallback="Barcha xarajatlar ro'yxati va ularning tahlili" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAddExpense onSubmit={addExpense} orgId={orgId} cars={carRefs} initialCarId={searchParams?.car_id || ''} openByDefault={searchParams?.quick === '1' || searchParams?.quick === 'true'} />
        </div>
      </div>
      {/* Filters: period, search, categories */}
      <div className="space-y-3">
        {/* Date + search form */}
        <form method="GET" className="bg-white border rounded-xl p-4 shadow-sm flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Boshlanish</label>
            <input type="date" name="from" defaultValue={searchParams?.from || ''} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tugash</label>
            <input type="date" name="to" defaultValue={searchParams?.to || ''} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Qidiruv</label>
            <input type="text" name="q" defaultValue={searchParams?.q || ''} placeholder="Izoh bo'yicha" className="border rounded-lg px-3 py-2 text-sm w-56" />
          </div>
          {searchParams?.cat && <input type="hidden" name="cat" value={searchParams.cat} />}
          <div className="ml-auto flex items-center gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">Qo&apos;llash</button>
            <a href="/expenses" className="px-3 py-2 border rounded-lg">Reset</a>
          </div>
        </form>

        {/* Quick presets for period */}
        <div className="flex flex-wrap gap-2 text-xs">
          {(() => {
            const today = new Date();
            const toStr = (d: Date) => d.toISOString().slice(0,10);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth()/3)*3, 1);
            const mk = (from: string, to: string, label: string) => {
              const p = new URLSearchParams({ from, to });
              if (searchParams?.cat) p.set('cat', searchParams.cat);
              if (searchParams?.q) p.set('q', searchParams.q);
              return <a key={label} href={`/expenses?${p.toString()}`} className="px-2.5 py-1 rounded-full ring-1 ring-gray-200 bg-white hover:bg-gray-50">{label}</a>;
            };
            return [
              mk(toStr(today), toStr(today), 'Bugun'),
              mk(toStr(startOfMonth), toStr(today), 'Oy'),
              mk(toStr(startOfQuarter), toStr(today), 'Kvartal'),
              mk(toStr(startOfYear), toStr(today), 'Yil'),
            ];
          })()}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {(() => {
            const cats = Array.from(new Set(expenseRows.map(e => e.category).filter(Boolean))) as string[];
            const hrefBase = (nextCat?: string) => {
              const p = new URLSearchParams();
              if (searchParams?.from) p.set('from', searchParams.from);
              if (searchParams?.to) p.set('to', searchParams.to);
              if (searchParams?.q) p.set('q', searchParams.q);
              if (nextCat) p.set('cat', nextCat);
              return `/expenses${p.toString() ? ('?' + p.toString()) : ''}`;
            };
            const active = searchParams?.cat || '';
            return [
              <a key="all" href={hrefBase(undefined)} className={`px-2.5 py-1 rounded-full text-xs ring-1 ${!active ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-gray-700 ring-gray-200'}`}>Barchasi</a>,
              ...cats.map(c => (
                <a key={c} href={hrefBase(c)} className={`px-2.5 py-1 rounded-full text-xs ring-1 ${active===c ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-gray-700 ring-gray-200'}`}>{c}</a>
              )),
            ];
          })()}
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="expenses.summary.total" fallback="Jami xarajatlar" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalAed.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {expenseRows.length} <Text path="expenses.summary.transactions" fallback="ta xarajat" />
          </div>
        </div>

        {/* Average Expense */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="expenses.summary.average" fallback="O'rtacha xarajat" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {expenseRows.length > 0
              ? (totalAed / expenseRows.length).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0.00'
            } AED
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <Text path="expenses.summary.perTransaction" fallback="har bir xarajat uchun" />
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="expenses.summary.topCategory" fallback="Eng ko'p xarajat" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          {topCategories.length > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900 capitalize">
                <Text path={`expenses.categories.${topCategories[0][0]}`} fallback={topCategories[0][0]} />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {topCategories[0][1].toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
              </div>
            </>
          ) : (
            <div className="text-xl text-gray-400">
              <Text path="expenses.summary.noData" fallback="Ma'lumot yo'q" />
            </div>
          )}
        </div>
      </div>

      {/* Top Categories Breakdown */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Text path="expenses.topCategories" fallback="Eng ko'p xarajat qilingan toifalar" />
          </h2>
          <div className="space-y-3">
            {topCategories.map(([category, amount]) => {
              const percentage = (amount / totalAed) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      <Text path={`expenses.categories.${category}`} fallback={category} />
                    </span>
                    <span className="text-sm text-gray-600">
                      {amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <Text path="expenses.allExpenses" fallback="Barcha xarajatlar" />
          </h2>
        </div>
        <div className="overflow-x-auto">
          <ExpensesClientTable rows={expenseRows} filename="expenses" />
        </div>
      </div>

      {/* Note about overhead expenses */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <Text path="expenses.noteOverhead" fallback="Eslatma: Avto tanlanmasa, xarajat 'Umumiy/Shaxsiy' hisoblanadi va avtomatik ravishda faol mashinalar orasida taqsimlanadi." />
          </div>
        </div>
      </div>
    </div>
  );
}

