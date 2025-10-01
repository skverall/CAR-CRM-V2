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
    <div className="mt-1 text-xs text-gray-600 grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-3">
      {/* Purchase */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700">B</span>
        <div className="flex flex-wrap items-baseline gap-x-1">
          <span>
            {fmt(purchasePrice)} {purchaseCurrency || "AED"}
            {purchaseCurrency && purchaseCurrency !== "AED" && purchaseRateToAed ? ` × ${purchaseRateToAed}` : ""}
          </span>
          <span className="text-gray-400">·</span>
          <span>{fmt(purchasePriceAED)} AED</span>
        </div>
      </div>
      {/* Expenses */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700">E</span>
        <div className="flex flex-wrap items-baseline gap-x-1">
          <span>
            <Text path="profit.directExpenses" fallback="To'g'ri" />: {fmt(directExpensesAED)}
          </span>
          <span className="text-gray-400">·</span>
          <span>
            <Text path="profit.overheadExpenses" fallback="Overhead" />: {fmt(overheadAED)}
          </span>
          <span className="text-gray-400">·</span>
          <span>
            <Text path="profit.totalCost" fallback="Jami tan narx" />: {fmt((purchaseComponentAED || purchasePriceAED || 0) + totalExpensesAED)} AED
          </span>
        </div>
      </div>
      {/* Sale & KPIs */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700">S</span>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span>
            <Text path="cars.table.soldPrice" fallback="Sotuv" />: {hasSale ? `${fmt(soldPriceAED)} AED` : "—"}
          </span>
          <span className="text-gray-400">·</span>
          <span>
            <Text path="cars.table.profit" fallback="Foyda" />: {profitAED != null ? `${profitAED >= 0 ? "+" : ""}${fmt(profitAED)}` : "—"} AED
          </span>
          <span className="text-gray-400">·</span>
          <span>
            ROI: {roiPct != null ? `${fmt(roiPct, "ru-RU", 1, 1)}%` : "—"}
          </span>
          <span className="text-gray-400">·</span>
          <span>
            <Text path="cars.table.margin" fallback="Marja" />: {marginPct != null ? `${fmt(marginPct, "ru-RU", 1, 1)}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

