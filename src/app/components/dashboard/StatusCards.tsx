"use client";
import Link from "next/link";
import Text from "@/app/components/i18n/Text";

type CardData = {
  key: string;
  href: string;
  gradient: string;
  icon: React.ReactNode;
  value: number;
  dictPath: string;
  description: string;
};

type StatusCardsProps = {
  counts: {
    total: number;
    inTransit: number;
    garage: number;
    forSale: number;
    sold: number;
    reserved: number;
  };
};

export default function StatusCards({ counts }: StatusCardsProps) {
  const cards: CardData[] = [
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
          
          <div className="relative p-5">
            {/* Icon and Value */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                {card.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {card.value}
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                <Text path={`${card.dictPath}.title`} fallback={
                  card.key === 'total' ? 'Jami avtomobillar' :
                  card.key === 'in_transit' ? "Yo'lda" :
                  card.key === 'garage' ? 'Garajda' :
                  card.key === 'for_sale' ? 'Sotuvda' :
                  card.key === 'sold' ? 'Sotilgan' :
                  card.key === 'reserved' ? 'Band' : card.key
                } />
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                <Text path={card.description} fallback={
                  card.key === 'total' ? 'Jami avtomobillar soni' :
                  card.key === 'in_transit' ? "Yo'lda bo'lgan avtomobillar" :
                  card.key === 'garage' ? "Garajda va ta'mirda" :
                  card.key === 'for_sale' ? "Sotuvga qo'yilgan" :
                  card.key === 'sold' ? 'Sotilgan avtomobillar' :
                  card.key === 'reserved' ? 'Bron qilingan' : ''
                } />
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

