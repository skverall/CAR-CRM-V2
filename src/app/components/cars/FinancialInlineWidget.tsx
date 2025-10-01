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
    <div className="mt-1 text-[14px] text-gray-800 leading-relaxed p-2 rounded-md">
      {/* Two-column compact layout: left = B/E, right = Cost/Sale/Profit */}
      <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 items-center">
        {/* B - Purchase */}
        <div className="inline-flex items-center gap-3 min-w-[130px]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-[12px] shrink-0">B</span>
          <span
            className="tabular-nums font-semibold whitespace-nowrap"
            title={`${fmt(purchasePrice)} ${purchaseCurrency || 'AED'}${purchaseCurrency && purchaseCurrency !== 'AED' && purchaseRateToAed ? ` × ${purchaseRateToAed}` : ''}`}
          >
            {fmt(purchasePriceAED)} AED
          </span>
        </div>
        {/* Total cost */}
        <div className="flex items-center justify-end gap-3 text-gray-600 whitespace-nowrap">
          <span><Text path="profit.totalCost" fallback="Cost" />:</span>
          <span className="tabular-nums font-semibold text-gray-900">{fmt(totalCost)} AED</span>
        </div>

        {/* E - Expenses */}
        <div className="inline-flex items-center gap-3 min-w-[130px]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-700 text-[12px] shrink-0">E</span>
          <span className="tabular-nums font-semibold whitespace-nowrap" title={`D: ${fmt(directExpensesAED)} • OH: ${fmt(overheadAED)}`}>
            {fmt(totalExpensesAED)} AED
          </span>
        </div>
        {/* S - Sale and Profit */}
        <div className="flex items-center justify-end gap-3 flex-nowrap whitespace-nowrap">
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-700 text-[12px] shrink-0">S</span>
            <span className="tabular-nums font-semibold whitespace-nowrap">{hasSale ? `${fmt(soldPriceAED)} AED` : '—'}</span>
          </span>
          <span className={`tabular-nums ml-3 ${profitAED != null && profitAED < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}`}>
            {profitAED != null ? `${profitAED >= 0 ? '+' : ''}${fmt(profitAED)} AED` : '—'}
          </span>
        </div>
      </div>

      {/* Secondary line: small metrics */}
      <div className="mt-1.5 text-[12px] text-gray-500 flex flex-wrap gap-x-6 gap-y-1.5">
        {marginPct != null && (
          <span className="whitespace-nowrap">{fmt(marginPct, 'ru-RU', 1, 1)}% <Text path="cars.table.margin" fallback="marja" /></span>
        )}
        {roiPct != null && (
          <span className="whitespace-nowrap">ROI {fmt(roiPct, 'ru-RU', 1, 1)}%</span>
        )}
      </div>
    </div>
  );
}

