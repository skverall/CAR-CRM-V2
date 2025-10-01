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
  return (
    <div className="mt-1 text-[14px] text-gray-800 space-y-1 leading-snug">
      {/* Line 1: Buy • Expenses • Cost */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700 text-[12px]">B</span>
          <span className="tabular-nums font-semibold" title={`${fmt(purchasePrice)} ${purchaseCurrency || 'AED'}${purchaseCurrency && purchaseCurrency !== 'AED' && purchaseRateToAed ? ` × ${purchaseRateToAed}` : ''}`}>
            {fmt(purchasePriceAED)} AED
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700 text-[12px]">E</span>
          <span className="tabular-nums font-semibold" title={`D: ${fmt(directExpensesAED)} • OH: ${fmt(overheadAED)}`}>
            {fmt(totalExpensesAED)} AED
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="text-gray-500"><Text path="profit.totalCost" fallback="Cost" />:</span>
          <span className="tabular-nums font-semibold">{fmt((purchaseComponentAED || purchasePriceAED || 0) + totalExpensesAED)} AED</span>
        </span>
      </div>

      {/* Line 2: Sale • Profit • Margin/ROI */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700 text-[12px]">S</span>
          <span className="tabular-nums font-semibold">{hasSale ? `${fmt(soldPriceAED)} AED` : '—'}</span>
        </span>
        <span className={`tabular-nums ${profitAED != null && profitAED < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}`}>
          {profitAED != null ? `${profitAED >= 0 ? '+' : ''}${fmt(profitAED)} AED` : '—'}
        </span>
        {marginPct != null && (
          <span className="text-gray-600">{fmt(marginPct, 'ru-RU', 1, 1)}% <Text path="cars.table.margin" fallback="marja" /></span>
        )}
        {roiPct != null && (
          <span className="text-gray-500">ROI {fmt(roiPct, 'ru-RU', 1, 1)}%</span>
        )}
      </div>
    </div>
  );
}

