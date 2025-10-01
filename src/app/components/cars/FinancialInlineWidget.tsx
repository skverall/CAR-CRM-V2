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
    <div className="mt-1 text-[13px] text-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-2 leading-snug">
      {/* Row 1: Purchase + Expenses (compact, с акцентом на цифры) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700">B</span>
        <span title={`${fmt(purchasePrice)} ${purchaseCurrency || 'AED'}${purchaseCurrency && purchaseCurrency !== 'AED' && purchaseRateToAed ? ` × ${purchaseRateToAed}` : ''}`}
          className="font-medium">
          {fmt(purchasePriceAED)} AED
        </span>
        <span className="text-gray-300">/</span>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700">E</span>
        <span className="font-medium" title={`D: ${fmt(directExpensesAED)} • OH: ${fmt(overheadAED)}`}>
          {fmt(totalExpensesAED)} AED
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">
          <Text path="profit.totalCost" fallback="Cost" />: <span className="font-medium">{fmt((purchaseComponentAED || purchasePriceAED || 0) + totalExpensesAED)} AED</span>
        </span>
      </div>

      {/* Row 2: Sale + Profit (яркий акцент) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700">S</span>
        <span className="font-medium">{hasSale ? `${fmt(soldPriceAED)} AED` : '—'}</span>
        <span className="text-gray-300">/</span>
        <span className={profitAED != null && profitAED < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
          {profitAED != null ? `${profitAED >= 0 ? '+' : ''}${fmt(profitAED)} AED` : '—'}
        </span>
        {marginPct != null && (
          <span className="text-gray-500">· <Text path="cars.table.margin" fallback="Marja" /> {fmt(marginPct, 'ru-RU', 1, 1)}%</span>
        )}
        {roiPct != null && (
          <span className="text-gray-500">· ROI {fmt(roiPct, 'ru-RU', 1, 1)}%</span>
        )}
      </div>
    </div>
  );
}

