"use client";

import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import StatusBadge from "@/app/components/ui/StatusBadge";
import Badge from "@/app/components/ui/Badge";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cars.map((car) => (
        <Link
          key={car.id}
          href={`/cars/${car.id}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] group"
        >
          {/* Header with gradient */}
          <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-5xl font-bold mb-2">
                  {car.make?.charAt(0) || 'C'}
                </div>
                <div className="text-sm font-medium opacity-90">
                  {car.model_year || '—'}
                </div>
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
          <div className="p-5 space-y-4">
            {/* Car info */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {car.make} {car.model}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
                VIN: {car.vin}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Purchase date */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  <Text path="cars.table.purchaseDate" fallback="Xarid sanasi" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(car.purchase_date).toLocaleDateString('uz-UZ', { 
                    day: '2-digit', 
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Purchase price */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  <Text path="cars.table.purchasePrice" fallback="Xarid narxi" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {car.purchase_price_aed != null 
                    ? `${car.purchase_price_aed.toLocaleString()} AED`
                    : '—'
                  }
                </div>
              </div>

              {/* Total cost */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  <Text path="cars.table.totalCost" fallback="Tan narx" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {(car.cost_base_aed ?? 0).toLocaleString()} AED
                </div>
              </div>

              {/* Days on lot */}
              {car.days_on_lot != null && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    <Text path="cars.table.days" fallback="Kunlar" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {car.days_on_lot} kun
                  </div>
                </div>
              )}
            </div>

            {/* Profit section */}
            {car.profit_aed != null && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      <Text path="cars.table.profit" fallback="Foyda" />
                    </div>
                    <div className={`text-lg font-bold ${car.profit_aed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()} AED
                    </div>
                  </div>
                  {car.margin_pct != null && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        <Text path="cars.table.margin" fallback="Marja" />
                      </div>
                      <Badge 
                        variant={car.margin_pct >= 20 ? 'success' : car.margin_pct >= 10 ? 'warning' : 'danger'}
                        size="lg"
                      >
                        {car.margin_pct.toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sold price (if sold) */}
            {car.sold_price_aed != null && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  <Text path="cars.table.soldPrice" fallback="Sotuv narxi" />
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {car.sold_price_aed.toLocaleString()} AED
                </div>
              </div>
            )}

            {/* View details button */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-blue-600 group-hover:text-blue-700 font-medium text-sm">
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

