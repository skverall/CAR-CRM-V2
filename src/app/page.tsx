import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { DashboardKPIs, TopProfitCar, BrandDistribution } from "@/types/api";

export const dynamic = "force-dynamic";

interface DashboardData {
  kpis: DashboardKPIs;
  topProfitCars: TopProfitCar[];
  lossCars: TopProfitCar[];
  brandDistribution: BrandDistribution[];
  recentActivity: Array<{
    id: string;
    type: 'purchase' | 'sale' | 'expense';
    description: string;
    amount_aed: number;
    date: string;
    car_vin?: string;
  }>;
}

async function getDashboardData(): Promise<DashboardData> {
  const db = getSupabaseAdmin();

  // For now, we'll use a default org_id - in production this would come from user context
  const orgId = 'default-org'; // TODO: Get from user session

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get KPIs from profit view
  const { data: soldCars } = await db
    .from('car_profit_view')
    .select('profit_aed, margin_pct, days_on_lot')
    .gte('sold_date', startDate)
    .lte('sold_date', endDate);

  // Get inventory counts
  const { data: inventoryCounts } = await db
    .from('au_cars')
    .select('status')
    .neq('status', 'archived');

  const inventory = (inventoryCounts || []).reduce((acc, car) => {
    acc[car.status] = (acc[car.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate KPIs
  const totalProfit = (soldCars || []).reduce((sum, car) => sum + (car.profit_aed || 0), 0);
  const avgMargin = soldCars?.length ?
    (soldCars || []).reduce((sum, car) => sum + (car.margin_pct || 0), 0) / soldCars.length : 0;
  const sortedDays = (soldCars || []).map(car => car.days_on_lot || 0).sort((a, b) => a - b);
  const medianDays = sortedDays.length ?
    sortedDays[Math.floor(sortedDays.length / 2)] : 0;

  const kpis: DashboardKPIs = {
    profit_total_aed: totalProfit,
    avg_margin_pct: avgMargin,
    median_days_to_sell: medianDays,
    inventory_counts: {
      in_transit: inventory.in_transit || 0,
      for_sale: inventory.for_sale || 0,
      reserved: inventory.reserved || 0,
      sold: inventory.sold || 0,
      archived: inventory.archived || 0
    }
  };

  // Get top profit cars
  const { data: topProfitCars } = await db
    .from('car_profit_view')
    .select('id, vin, make, model, profit_aed, margin_pct, days_on_lot')
    .gte('sold_date', startDate)
    .lte('sold_date', endDate)
    .order('profit_aed', { ascending: false })
    .limit(5);

  // Get loss cars
  const { data: lossCars } = await db
    .from('car_profit_view')
    .select('id, vin, make, model, profit_aed, margin_pct, days_on_lot')
    .gte('sold_date', startDate)
    .lte('sold_date', endDate)
    .lt('profit_aed', 0)
    .order('profit_aed', { ascending: true })
    .limit(5);

  // Get brand distribution
  const { data: brandData } = await db
    .from('au_cars')
    .select(`
      make,
      car_profit_view(profit_aed, margin_pct)
    `)
    .gte('purchase_date', startDate);

  const brandDistribution: BrandDistribution[] = [];
  const brandMap = new Map<string, { count: number; totalProfit: number; totalMargin: number; profitCount: number }>();

  (brandData || []).forEach(car => {
    const brand = car.make || 'Unknown';
    const existing = brandMap.get(brand) || { count: 0, totalProfit: 0, totalMargin: 0, profitCount: 0 };

    existing.count++;
    if (car.car_profit_view?.profit_aed) {
      existing.totalProfit += car.car_profit_view.profit_aed;
      existing.totalMargin += car.car_profit_view.margin_pct || 0;
      existing.profitCount++;
    }

    brandMap.set(brand, existing);
  });

  brandMap.forEach((data, brand) => {
    brandDistribution.push({
      brand,
      count: data.count,
      avg_profit_aed: data.profitCount > 0 ? data.totalProfit / data.profitCount : 0,
      avg_margin_pct: data.profitCount > 0 ? data.totalMargin / data.profitCount : 0
    });
  });

  // Get recent activity
  const { data: recentExpenses } = await db
    .from('au_expenses')
    .select(`
      id,
      occurred_at,
      amount_aed,
      description,
      scope,
      au_cars(vin)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentIncomes } = await db
    .from('au_incomes')
    .select(`
      id,
      occurred_at,
      amount_aed,
      description,
      au_cars(vin)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentActivity = [
    ...(recentExpenses || []).map(exp => ({
      id: exp.id,
      type: 'expense' as const,
      description: exp.description || `${exp.scope} expense`,
      amount_aed: -(exp.amount_aed || 0),
      date: exp.occurred_at,
      car_vin: exp.au_cars?.vin
    })),
    ...(recentIncomes || []).map(inc => ({
      id: inc.id,
      type: inc.description?.includes('[SALE]') ? 'sale' as const : 'income' as const,
      description: inc.description || 'Income',
      amount_aed: inc.amount_aed || 0,
      date: inc.occurred_at,
      car_vin: inc.au_cars?.vin
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return {
    kpis,
    topProfitCars: topProfitCars || [],
    lossCars: lossCars || [],
    brandDistribution,
    recentActivity
  };
}

export default async function Dashboard() {
  const dashboardData = await getDashboardData();

  return (
    <div className="grid gap-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Avtomobil CRM Boshqaruv Paneli</h1>
        <div className="text-sm text-gray-500">
          So'nggi 30 kun ma'lumotlari
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm font-medium text-green-600">Umumiy foyda</div>
          <div className="text-2xl font-bold text-green-900">
            {dashboardData.kpis.profit_total_aed.toLocaleString()} AED
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm font-medium text-blue-600">O'rtacha marja</div>
          <div className="text-2xl font-bold text-blue-900">
            {dashboardData.kpis.avg_margin_pct.toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm font-medium text-purple-600">O'rtacha sotish vaqti</div>
          <div className="text-2xl font-bold text-purple-900">
            {dashboardData.kpis.median_days_to_sell} kun
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm font-medium text-orange-600">Faol avtomobillar</div>
          <div className="text-2xl font-bold text-orange-900">
            {dashboardData.kpis.inventory_counts.for_sale + dashboardData.kpis.inventory_counts.in_transit}
          </div>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Inventar holati</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.kpis.inventory_counts.in_transit}
            </div>
            <div className="text-sm text-gray-600">Yo'lda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.kpis.inventory_counts.for_sale}
            </div>
            <div className="text-sm text-gray-600">Sotuvda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.kpis.inventory_counts.reserved}
            </div>
            <div className="text-sm text-gray-600">Band</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.kpis.inventory_counts.sold}
            </div>
            <div className="text-sm text-gray-600">Sotilgan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {dashboardData.kpis.inventory_counts.archived}
            </div>
            <div className="text-sm text-gray-600">Arxivlangan</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Profit Cars */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Eng foydali avtomobillar</h2>
          <div className="space-y-3">
            {dashboardData.topProfitCars.length > 0 ? (
              dashboardData.topProfitCars.map((car) => (
                <div key={car.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <div>
                    <div className="font-medium">{car.vin}</div>
                    <div className="text-sm text-gray-600">{car.make} {car.model}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{car.profit_aed.toLocaleString()} AED</div>
                    <div className="text-sm text-gray-600">{car.margin_pct.toFixed(1)}% • {car.days_on_lot} kun</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">Ma'lumot yo'q</div>
            )}
          </div>
        </div>

        {/* Loss Cars */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Zarar keltirgan avtomobillar</h2>
          <div className="space-y-3">
            {dashboardData.lossCars.length > 0 ? (
              dashboardData.lossCars.map((car) => (
                <div key={car.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <div className="font-medium">{car.vin}</div>
                    <div className="text-sm text-gray-600">{car.make} {car.model}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{car.profit_aed.toLocaleString()} AED</div>
                    <div className="text-sm text-gray-600">{car.margin_pct.toFixed(1)}% • {car.days_on_lot} kun</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">Zarar yo'q 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Distribution */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Brendlar bo'yicha taqsimot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.brandDistribution.slice(0, 6).map((brand) => (
            <div key={brand.brand} className="p-4 border rounded-lg">
              <div className="font-medium">{brand.brand}</div>
              <div className="text-sm text-gray-600">{brand.count} ta avtomobil</div>
              <div className="text-sm">
                O'rtacha foyda: <span className="font-medium">{brand.avg_profit_aed.toLocaleString()} AED</span>
              </div>
              <div className="text-sm">
                O'rtacha marja: <span className="font-medium">{brand.avg_margin_pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">So'nggi faoliyat</h2>
        <div className="space-y-2">
          {dashboardData.recentActivity.map((activity) => (
            <div key={activity.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'sale' ? 'bg-green-500' :
                  activity.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div>
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-gray-600">
                    {activity.car_vin && `${activity.car_vin} • `}
                    {new Date(activity.date).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
              </div>
              <div className={`font-medium ${
                activity.amount_aed > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {activity.amount_aed > 0 ? '+' : ''}{activity.amount_aed.toLocaleString()} AED
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
