import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
export const dynamic = "force-dynamic";
import Text from "@/app/components/i18n/Text";

type CarWithProfit = {
  id: string;
  vin: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  status: "in_transit" | "for_sale" | "reserved" | "sold" | "archived";
  purchase_date: string;
  purchase_price: number;
  purchase_currency: string;
  purchase_rate_to_aed: number;
  decision_tag: "take" | "skip" | null;
  // Cost and profit data
  total_cost_aed: number;
  profit_aed: number | null;
  margin_pct: number | null;
  days_on_lot: number | null;
  sold_price_aed: number | null;
};

type CarInsert = {
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  purchase_date: string;
  purchase_currency: string;
  purchase_rate_to_aed: number;
  purchase_price: number;
  mileage?: number;
  notes?: string;
  source?: string;
};

async function getCarsWithProfit(): Promise<CarWithProfit[]> {
  const db = getSupabaseAdmin();
  
  // Get cars with cost data
  const { data: carsWithCost } = await db
    .from('car_cost_view')
    .select(`
      id,
      vin,
      make,
      model,
      status,
      purchase_date,
      total_cost_aed,
      au_cars!inner(
        model_year,
        purchase_price,
        purchase_currency,
        purchase_rate_to_aed,
        decision_tag,
        sold_price_aed
      )
    `)
    .order('purchase_date', { ascending: false });

  // Get profit data for sold cars
  const soldCarIds = (carsWithCost || [])
    .filter(car => car.status === 'sold')
    .map(car => car.id);

  let profitData: Record<string, Record<string, unknown>> = {};
  if (soldCarIds.length > 0) {
    const { data: profits } = await db
      .from('car_profit_view')
      .select('id, profit_aed, margin_pct, days_on_lot')
      .in('id', soldCarIds);
    
    profitData = (profits || []).reduce((acc, profit) => {
      acc[profit.id] = profit;
      return acc;
    }, {} as Record<string, Record<string, unknown>>);
  }

  // Combine data
  return (carsWithCost || []).map((car: Record<string, unknown>) => ({
    id: car.id as string,
    vin: car.vin as string,
    make: car.make as string,
    model: car.model as string,
    model_year: (car.au_cars as Record<string, unknown>).model_year as number,
    status: car.status as "in_transit" | "for_sale" | "reserved" | "sold" | "archived",
    purchase_date: car.purchase_date as string,
    purchase_price: (car.au_cars as Record<string, unknown>).purchase_price as number,
    purchase_currency: (car.au_cars as Record<string, unknown>).purchase_currency as string,
    purchase_rate_to_aed: (car.au_cars as Record<string, unknown>).purchase_rate_to_aed as number,
    decision_tag: (car.au_cars as Record<string, unknown>).decision_tag as "take" | "skip" | null,
    total_cost_aed: car.total_cost_aed as number,
    profit_aed: profitData[car.id as string]?.profit_aed as number || null,
    margin_pct: profitData[car.id as string]?.margin_pct as number || null,
    days_on_lot: profitData[car.id as string]?.days_on_lot as number || null,
    sold_price_aed: (car.au_cars as Record<string, unknown>).sold_price_aed ? ((car.au_cars as Record<string, unknown>).sold_price_aed as number) / 100 : null
  }));
}

async function addCar(formData: FormData) {
  "use server";
  const payload: CarInsert = {
    vin: String(formData.get("vin") || "").trim(),
    make: String(formData.get("make") || "").trim(),
    model: String(formData.get("model") || "").trim(),
    model_year: Number(formData.get("model_year")) || null,
    source: String(formData.get("source") || "").trim(),
    purchase_date: String(formData.get("purchase_date")),
    purchase_currency: String(formData.get("purchase_currency")),
    purchase_rate_to_aed: Number(formData.get("purchase_rate_to_aed")),
    purchase_price: Number(formData.get("purchase_price")),
    mileage: Number(formData.get("mileage")) || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined
  };

  // Convert price to fils for storage
  const purchasePriceAedFils = Math.round(payload.purchase_price * payload.purchase_rate_to_aed * 100);

  const db = getSupabaseAdmin();
  // Resolve organization (align with other pages using Default Organization)
  const { data: org } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  const orgId = (org as { id: string } | null)?.id;
  if (!orgId) {
    throw new Error("Organization not found. Please create 'Default Organization'.");
  }
  await db.from("au_cars").insert([{
    ...payload,
    purchase_price_aed: purchasePriceAedFils,
    status: "in_transit",
    org_id: orgId
  }]);
}

function getStatusBadge(status: string) {
  const statusConfig = {
    in_transit: { key: "status.in_transit", color: "bg-blue-100 text-blue-800" },
    for_sale: { key: "status.for_sale", color: "bg-green-100 text-green-800" },
    reserved: { key: "status.reserved", color: "bg-yellow-100 text-yellow-800" },
    sold: { key: "status.sold", color: "bg-purple-100 text-purple-800" },
    archived: { key: "status.archived", color: "bg-gray-100 text-gray-800" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_transit;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Text path={config.key} />
    </span>
  );
}

function getDecisionBadge(decision: "take" | "skip" | null) {
  if (!decision) return null;
  
  return decision === "take" ? (
    <span className="text-green-600 text-lg">✅</span>
  ) : (
    <span className="text-red-600 text-lg">❌</span>
  );
}

export default async function CarsPage() {
  const cars = await getCarsWithProfit();

  // Calculate summary stats
  const totalCars = cars.length;
  const soldCars = cars.filter(car => car.status === 'sold');
  const totalProfit = soldCars.reduce((sum, car) => sum + (car.profit_aed || 0), 0);
  const avgMargin = soldCars.length > 0 ? 
    soldCars.reduce((sum, car) => sum + (car.margin_pct || 0), 0) / soldCars.length : 0;

  return (
    <div className="grid gap-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold"><Text path="cars.title" fallback="Avtomobillar" /></h1>
        <div className="flex gap-4">
          <div className="text-sm">
            <span className="text-gray-600"><Text path="cars.summary.total" fallback="Jami" />: </span>
            <span className="font-semibold">{totalCars}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600"><Text path="cars.summary.totalProfit" fallback="Umumiy foyda" />: </span>
            <span className="font-semibold text-green-600">{totalProfit.toLocaleString()} AED</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600"><Text path="cars.summary.avgMargin" fallback="O'rtacha marja" />: </span>
            <span className="font-semibold">{avgMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Add Car Form */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4"><Text path="cars.addTitle" fallback="Yangi avtomobil qo‘shish" /></h2>
        <form action={addCar} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <input name="vin" placeholder="VIN" required className="border px-3 py-2 rounded" />
          <input name="make" placeholder="Marka" required className="border px-3 py-2 rounded" />
          <input name="model" placeholder="Model" required className="border px-3 py-2 rounded" />
          <input name="model_year" type="number" placeholder="Yil" className="border px-3 py-2 rounded" />
          <input name="purchase_date" type="date" required className="border px-3 py-2 rounded" />
          <input name="purchase_price" type="number" step="0.01" placeholder="Narx" required className="border px-3 py-2 rounded" />
          <select name="purchase_currency" required className="border px-3 py-2 rounded">
            <option value="">Valyuta</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="EUR">EUR</option>
          </select>
          <input name="purchase_rate_to_aed" type="number" step="0.01" placeholder="AED kursi" required className="border px-3 py-2 rounded" />
          <input name="mileage" type="number" placeholder="Probeg (km)" className="border px-3 py-2 rounded" />
          <input name="source" placeholder="Manba" className="border px-3 py-2 rounded" />
          <input name="notes" placeholder="Izohlar" className="border px-3 py-2 rounded col-span-2" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-2 sm:col-span-1">
            <Text path="cars.addCta" fallback="Qo‘shish" />
          </button>
        </form>
      </div>

      {/* Cars Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.car" fallback="Avtomobil" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.status" fallback="Holat" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.purchaseDate" fallback="Xarid sanasi" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.totalCost" fallback="Tan narx (AED)" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.soldPrice" fallback="Sotuv narxi" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.profit" fallback="Foyda" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.margin" fallback="Marja" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.days" fallback="Kunlar" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.decision" fallback="Qaror" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Text path="cars.table.actions" fallback="Amallar" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{car.vin}</div>
                      <div className="text-sm text-gray-500">
                        {car.make} {car.model} {car.model_year}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(car.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(car.purchase_date).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {car.total_cost_aed.toLocaleString()} AED
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {car.sold_price_aed ? `${car.sold_price_aed.toLocaleString()} AED` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {car.profit_aed !== null ? (
                      <span className={car.profit_aed >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()} AED
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {car.margin_pct !== null ? `${car.margin_pct.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {car.days_on_lot !== null ? `${car.days_on_lot} kun` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getDecisionBadge(car.decision_tag)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/cars/${car.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Text path="cars.table.view" fallback="Ko'rish" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
