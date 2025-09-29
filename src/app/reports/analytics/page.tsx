import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrgId } from "@/lib/getOrgId";
export const dynamic = "force-dynamic";

import Text from "@/app/components/i18n/Text";
import ProfitChart from "@/app/components/analytics/ProfitChart";
import Badge from "@/app/components/ui/Badge";

type SoldCar = {
  id: string;
  vin: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  sold_date: string;
  profit_aed: number;
  margin_pct: number;
  days_on_lot: number | null;
};

export default async function AnalyticsPage() {
  const orgId = await getOrgId();
  const db = getSupabaseAdmin();

  // Get sold cars with profit data
  const { data: soldCars } = await db
    .from('car_profit_view')
    .select('id, vin, make, model, model_year, sold_date, profit_aed, margin_pct, days_on_lot')
    .eq('org_id', orgId)
    .order('sold_date', { ascending: false })
    .limit(50);

  const cars = (soldCars || []) as SoldCar[];

  // Prepare data for chart
  const chartData = cars.map(car => ({
    date: car.sold_date,
    profit: Number(car.profit_aed),
    margin: Number(car.margin_pct),
    carName: `${car.make || ''} ${car.model || ''} ${car.model_year || ''}`.trim() || car.vin,
  }));

  // Calculate overall stats
  const totalProfit = cars.reduce((sum, car) => sum + Number(car.profit_aed), 0);
  const avgMargin = cars.length > 0 
    ? cars.reduce((sum, car) => sum + Number(car.margin_pct), 0) / cars.length 
    : 0;
  const avgDaysToSell = cars.length > 0
    ? cars.reduce((sum, car) => sum + (car.days_on_lot || 0), 0) / cars.length
    : 0;

  const profitableCars = cars.filter(car => Number(car.profit_aed) > 0);
  const lossCars = cars.filter(car => Number(car.profit_aed) < 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            <Text path="analytics.title" fallback="Analitika" />
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <Text path="analytics.subtitle" fallback="Foyda va sotuvlar tahlili" />
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Profit */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="analytics.totalProfit" fallback="Jami foyda" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">AED</div>
        </div>

        {/* Average Margin */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="analytics.avgMargin" fallback="O'rtacha marja" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {avgMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <Badge 
              variant={avgMargin >= 20 ? 'success' : avgMargin >= 10 ? 'warning' : 'danger'}
              size="sm"
            >
              {avgMargin >= 20 ? (
                <Text path="analytics.excellent" fallback="A'lo" />
              ) : avgMargin >= 10 ? (
                <Text path="analytics.good" fallback="Yaxshi" />
              ) : (
                <Text path="analytics.needsImprovement" fallback="Yaxshilash kerak" />
              )}
            </Badge>
          </div>
        </div>

        {/* Cars Sold */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="analytics.carsSold" fallback="Sotilgan avtomobillar" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {cars.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className="text-green-600">{profitableCars.length} <Text path="analytics.profitable" fallback="foydali" /></span>
            {lossCars.length > 0 && (
              <span className="text-red-600 ml-2">{lossCars.length} <Text path="analytics.loss" fallback="zarar" /></span>
            )}
          </div>
        </div>

        {/* Average Days to Sell */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <Text path="analytics.avgDaysToSell" fallback="O'rtacha sotuv muddati" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {Math.round(avgDaysToSell)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <Text path="analytics.days" fallback="kun" />
          </div>
        </div>
      </div>

      {/* Profit Chart */}
      <ProfitChart data={chartData} />

      {/* Top Profitable Cars */}
      {profitableCars.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            <Text path="analytics.topProfitableCars" fallback="Eng foydali avtomobillar" />
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.rank" fallback="#" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.car" fallback="Avtomobil" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.soldDate" fallback="Sotuv sanasi" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.profit" fallback="Foyda" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.margin" fallback="Marja" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    <Text path="analytics.daysOnLot" fallback="Kunlar" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profitableCars
                  .sort((a, b) => Number(b.profit_aed) - Number(a.profit_aed))
                  .slice(0, 10)
                  .map((car, index) => (
                    <tr key={car.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {car.make} {car.model} {car.model_year || ''}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {car.vin}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(car.sold_date).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-bold text-green-600">
                          +{formatCurrency(Number(car.profit_aed))} AED
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge 
                          variant={car.margin_pct >= 20 ? 'success' : car.margin_pct >= 10 ? 'warning' : 'default'}
                          size="sm"
                        >
                          {car.margin_pct.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {car.days_on_lot || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loss Cars */}
      {lossCars.length > 0 && (
        <div className="card border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-red-900">
              <Text path="analytics.lossCars" fallback="Zarar ko'rgan avtomobillar" />
            </h3>
          </div>
          <div className="space-y-2">
            {lossCars
              .sort((a, b) => Number(a.profit_aed) - Number(b.profit_aed))
              .map((car) => (
                <div key={car.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {car.make} {car.model} {car.model_year || ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(car.sold_date).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">
                      {formatCurrency(Number(car.profit_aed))} AED
                    </div>
                    <div className="text-xs text-gray-600">
                      {car.margin_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

