import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

  const cards: Array<{
    key: string;
    href: string;
    gradient: string;
    icon: React.ReactNode;
    value: number;
    dictPath: string;
    description: string;
  }> = [
    {
      key: "total",
      href: "/cars",
      gradient: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      value: counts.total,
      dictPath: "dashboard.cards.total",
      description: "dashboard.cards.total.description"
    },
    {
      key: "in_transit",
      href: "/cars?status=in_transit",
      gradient: "from-indigo-500 to-indigo-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      value: counts.inTransit,
      dictPath: "dashboard.cards.in_transit",
      description: "dashboard.cards.in_transit.description"
    },
    {
      key: "garage",
      href: "/cars?status=available,repair",
      gradient: "from-amber-500 to-amber-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      value: counts.garage,
      dictPath: "dashboard.cards.garage",
      description: "dashboard.cards.garage.description"
    },
    {
      key: "for_sale",
      href: "/cars?status=for_sale,listed",
      gradient: "from-green-500 to-green-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      value: counts.forSale,
      dictPath: "dashboard.cards.for_sale",
      description: "dashboard.cards.for_sale.description"
    },
    {
      key: "sold",
      href: "/cars?status=sold",
      gradient: "from-purple-500 to-purple-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      value: counts.sold,
      dictPath: "dashboard.cards.sold",
      description: "dashboard.cards.sold.description"
    },
    {
      key: "reserved",
      href: "/cars?status=reserved",
      gradient: "from-yellow-500 to-yellow-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      value: counts.reserved,
      dictPath: "dashboard.cards.reserved",
      description: "dashboard.cards.reserved.description"
    },
  ];

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
          <Text path="dashboard.title" fallback="Панель управления" />
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          <Text path="dashboard.subtitle" fallback="Avtomobillar bozorini boshqarish tizimi. Barcha ma'lumotlar real vaqtda yangilanadi." />
        </p>
      </div>

      {/* Stats Cards with improved design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <Link
            key={card.key}
            href={card.href}
            className="block group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] h-full p-5 relative overflow-hidden">
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              <div className="relative z-10">
                {/* Icon and Value */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 leading-none group-hover:scale-110 transition-transform">
                      {card.value}
                    </div>
                  </div>
                </div>

                {/* Title and Description */}
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    <Text path={`${card.dictPath}.title`} fallback={card.key} />
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    <Text path={card.description} fallback={card.key} />
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center text-xs font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                  <span><Text path="dashboard.viewDetails" fallback="Ko'rish" /></span>
                  <svg className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions with improved design */}
      <div className="card p-6 md:p-8">
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

          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Sozlamalar</div>
              <div className="text-sm text-gray-500">Tizim sozlamalari</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
