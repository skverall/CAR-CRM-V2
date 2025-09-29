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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      value: counts.total,
      dictPath: "dashboard.cards.total",
      description: "Jami avtomobillar soni"
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
      description: "Yo'lda bo'lgan avtomobillar"
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
      description: "Garajda va ta'mirda"
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
      description: "Sotuvga qo'yilgan"
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
      description: "Sotilgan avtomobillar"
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
      description: "Bron qilingan"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Text path="dashboard.title" fallback="Панель управления" />
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Avtomobillar bozorini boshqarish tizimi. Barcha ma&apos;lumotlar real vaqtda yangilanadi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 group-hover:shadow-md group-hover:scale-105 group-hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-sm`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 leading-none">
                    {card.value}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  <Text path={card.dictPath} fallback={card.key} />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Hover indicator */}
              <div className="mt-4 flex items-center text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                <span>Ko&apos;rish</span>
                <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tezkor amallar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/cars"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Avtomobillar</div>
              <div className="text-sm text-gray-500">Barcha avtomobillarni ko&apos;rish</div>
            </div>
          </Link>

          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Yangi avtomobil</div>
              <div className="text-sm text-gray-500">Yangi avtomobil qo&apos;shish</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Hisobotlar</div>
              <div className="text-sm text-gray-500">Moliyaviy hisobotlar</div>
            </div>
          </button>

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
