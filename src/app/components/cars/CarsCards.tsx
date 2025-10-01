"use client";

import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import StatusBadge from "@/app/components/ui/StatusBadge";

type CarRow = {
  id: string;
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  status: 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived' | 'available' | 'repair' | 'listed';
  purchase_date: string;
  purchase_price_aed: number | null;
  cost_base_aed: number;
  sold_price_aed: number | null;
  profit_aed: number | null;
  margin_pct: number | null;
  days_on_lot: number | null;
};

type Props = {
  cars: CarRow[];
};

export default function CarsCards({ cars }: Props) {
  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">
          <Text path="cars.empty" fallback="Hech qanday avtomobil topilmadi" />
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cars.map((car) => (
        <Link
          key={car.id}
          href={`/cars/${car.id}`}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 cursor-pointer group overflow-hidden"
        >
          {/* Header with gradient and car icon */}
          <div className="relative h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 overflow-hidden">
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />

            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            {/* Car icon and year */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <div className="text-sm font-semibold opacity-90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {car.model_year || '—'}
              </div>
            </div>

            {/* Status badge in corner */}
            <div className="absolute top-3 right-3">
              <StatusBadge status={car.status}>
                <Text path={`status.${car.status}`} fallback={car.status} />
              </StatusBadge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Car info */}
            <div className="text-center border-b border-gray-100 pb-4">
              <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                {car.make} {car.model}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {car.vin}
              </p>
            </div>

            {/* Key metrics in a clean layout */}
            <div className="space-y-3">
              {/* Purchase info */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">
                      <Text path="cars.table.purchasePrice" fallback="Xarid" />
                    </div>
                    <div className="text-sm font-bold text-blue-900">
                      {car.purchase_price_aed != null
                        ? `${car.purchase_price_aed.toLocaleString()} AED`
                        : '—'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(car.purchase_date).toLocaleDateString('uz-UZ', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                </div>
              </div>

              {/* Cost base */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">
                      <Text path="cars.table.totalCost" fallback="Tan narx" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {(car.cost_base_aed ?? 0).toLocaleString()} AED
                    </div>
                  </div>
                </div>
                {car.days_on_lot != null && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {car.days_on_lot} kun
                    </div>
                  </div>
                )}
              </div>

              {/* Sold price (if sold) */}
              {car.sold_price_aed != null && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-green-600 font-medium">
                        <Text path="cars.table.soldPrice" fallback="Sotildi" />
                      </div>
                      <div className="text-sm font-bold text-green-900">
                        {car.sold_price_aed.toLocaleString()} AED
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profit section */}
              {car.profit_aed != null && (
                <div className={`p-4 rounded-lg ${car.profit_aed >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: car.profit_aed >= 0 ? '#059669' : '#dc2626' }}>
                        <Text path="cars.table.profit" fallback="Foyda" />
                      </div>
                      <div className={`text-2xl font-bold ${car.profit_aed >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">AED</div>
                    </div>
                    {car.margin_pct != null && (
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${car.margin_pct >= 20 ? 'text-green-600' : car.margin_pct >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {car.margin_pct.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <Text path="cars.table.margin" fallback="marja" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View details button */}
            <div className="pt-2">
              <div className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-sm text-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all flex items-center justify-center gap-2">
                <Text path="cars.table.viewDetails" fallback="Batafsil ko'rish" />
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

