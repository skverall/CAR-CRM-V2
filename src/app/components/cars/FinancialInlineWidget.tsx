"use client";

import Text from "@/app/components/i18n/Text";

export type FinancialInlineWidgetProps = {
  purchaseCurrency?: string;
  purchaseRateToAed?: number;
  purchasePrice?: number; // original in purchaseCurrency
  purchasePriceAED?: number | null;
  purchaseComponentAED?: number; // from view
  directExpensesAED?: number; // from view
  overheadAED?: number; // from view
  soldPriceAED?: number | null;
  profitAED?: number | null;
  marginPct?: number | null;
  roiPct?: number | null;
};

function fmt(n?: number | null, locale = "ru-RU", min = 0, max = 2) {
  if (n == null) return "—";
  return n.toLocaleString(locale, { minimumFractionDigits: min, maximumFractionDigits: max });
}

export default function FinancialInlineWidget({
  purchaseCurrency,
  purchaseRateToAed,
  purchasePrice,
  purchasePriceAED,
  purchaseComponentAED,
  directExpensesAED,
  overheadAED,
  soldPriceAED,
  profitAED,
  marginPct,
  roiPct,
}: FinancialInlineWidgetProps) {
  const hasSale = typeof soldPriceAED === "number" && soldPriceAED != null;
  const totalExpensesAED = (directExpensesAED || 0) + (overheadAED || 0);
  const totalCost = (purchaseComponentAED || purchasePriceAED || 0) + totalExpensesAED;
  return (
    <div className="mt-1 text-[13px] text-gray-800 leading-relaxed max-w-full min-w-0">
      {/* Вертикальная компоновка — компактно, без горизонтального скролла */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Purchase */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <span className="text-xs text-gray-600 flex-shrink-0"><Text path="profit.purchasePrice" fallback="Xarid" /></span>
          <span
            className="tabular-nums font-semibold whitespace-nowrap"
            title={`${fmt(purchasePrice)} ${purchaseCurrency || 'AED'}${purchaseCurrency && purchaseCurrency !== 'AED' && purchaseRateToAed ? ` × ${purchaseRateToAed}` : ''}`}
          >
            {fmt(purchasePriceAED)} AED
          </span>
        </div>

        {/* Expenses (direct + overhead) */}
        <div className="flex items-center justify-between gap-3 min-w-0" title={`To'g'ridan-to'g'ri: ${fmt(directExpensesAED)} • Overhead: ${fmt(overheadAED)}`}>
          <span className="text-xs text-gray-600 flex-shrink-0"><Text path="expenses.summary.total" fallback="Xarajatlar" /></span>
          <span className="tabular-nums font-semibold whitespace-nowrap">{fmt(totalExpensesAED)} AED</span>
        </div>

        {/* Total Cost */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <span className="text-xs text-gray-600 flex-shrink-0"><Text path="profit.totalCost" fallback="Jami tan narx" /></span>
          <span className="tabular-nums font-semibold text-gray-900 whitespace-nowrap">{fmt(totalCost)} AED</span>
        </div>

        {/* Sale & Profit */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <span className="text-xs text-gray-600 flex-shrink-0"><Text path="profit.salePrice" fallback="Sotuv" /></span>
          <span className="flex items-baseline gap-2 flex-shrink-0 whitespace-nowrap">
            <span className="tabular-nums font-semibold">{hasSale ? `${fmt(soldPriceAED)} AED` : '—'}</span>
            <span className={`tabular-nums ${profitAED != null && profitAED < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}`}>
              {profitAED != null ? `${profitAED >= 0 ? '+' : ''}${fmt(profitAED)} AED` : '—'}
            </span>
          </span>
        </div>

        {/* Secondary line: small metrics */}
        <div className="mt-0.5 text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
          {marginPct != null && (
            <span className="whitespace-nowrap">{fmt(marginPct, 'ru-RU', 1, 1)}% <Text path="cars.table.margin" fallback="Marja" /></span>
          )}
          {roiPct != null && (
            <span className="whitespace-nowrap">ROI {fmt(roiPct, 'ru-RU', 1, 1)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

