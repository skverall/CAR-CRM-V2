import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import StatusCards from "@/app/components/dashboard/StatusCards";

export const dynamic = "force-dynamic";

async function getCounts() {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("au_cars")
    .select("status")
    .neq("status", "archived");
  const rows = data || [];
  const byStatus = rows.reduce((acc: Record<string, number>, r: { status: string }) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = rows.length;
  const inTransit = byStatus["in_transit"] || 0;
  const sold = byStatus["sold"] || 0;
  const reserved = byStatus["reserved"] || 0;
  const forSale = (byStatus["for_sale"] || 0) + (byStatus["listed"] || 0);
  const garage = (byStatus["available"] || 0) + (byStatus["repair"] || 0);

  return { total, inTransit, garage, forSale, sold, reserved };
}

export default async function Dashboard() {
  const counts = await getCounts();

  return (
    <div className="space-y-8 animate-in fade-in-0">
      {/* Header with gradient */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <Text path="dashboard.last30" fallback="So'nggi 30 kun ma'lumotlari" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          <Text path="dashboard.title" fallback="Avtomobil CRM Boshqaruv Paneli" />
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          <Text path="dashboard.subtitle" fallback="Avtomobillar bozorini boshqarish tizimi. Barcha ma'lumotlar real vaqtda yangilanadi." />
        </p>
      </div>

      {/* Stats Cards with improved design */}
      <StatusCards counts={counts} />

      {/* Quick Actions with improved design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              <Text path="dashboard.quickActions.title" fallback="Tezkor amallar" />
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              <Text path="dashboard.quickActions.subtitle" fallback="Tez-tez ishlatiladigan amallar" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/cars"
            className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] p-5 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">
                  <Text path="dashboard.quickActions.viewCars.title" fallback="Avtomobillar" />
                </div>
                <div className="text-sm text-gray-500 line-clamp-2">
                  <Text path="dashboard.quickActions.viewCars.description" fallback="Barcha avtomobillarni ko'rish" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/cars?action=add"
            className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] p-5 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">
                  <Text path="dashboard.quickActions.addCar.title" fallback="Yangi avtomobil" />
                </div>
                <div className="text-sm text-gray-500 line-clamp-2">
                  <Text path="dashboard.quickActions.addCar.description" fallback="Yangi avtomobil qo'shish" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/expenses"
            className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] p-5 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">
                  <Text path="dashboard.quickActions.expenses.title" fallback="Xarajatlar" />
                </div>
                <div className="text-sm text-gray-500 line-clamp-2">
                  <Text path="dashboard.quickActions.expenses.description" fallback="Xarajatlarni boshqarish" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/reports"
            className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] p-5 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">
                  <Text path="dashboard.quickActions.reports.title" fallback="Hisobotlar" />
                </div>
                <div className="text-sm text-gray-500 line-clamp-2">
                  <Text path="dashboard.quickActions.reports.description" fallback="Moliyaviy hisobotlar" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
