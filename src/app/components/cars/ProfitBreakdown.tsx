"use client";

import { useMemo } from "react";
import Text from "@/app/components/i18n/Text";
import Badge from "@/app/components/ui/Badge";
import { useT } from "@/app/i18n/LangContext";

type ProfitBreakdownProps = {
  purchasePrice: number;
  purchaseCurrency: string;
  purchaseRate: number;
  directExpenses: number;
  overheadExpenses: number;
  soldPrice?: number;
  commission?: number;
  status: string;
};

export default function ProfitBreakdown({
  purchasePrice,
  purchaseCurrency,
  purchaseRate,
  directExpenses,
  overheadExpenses,
  soldPrice,
  commission = 0,
  status,
}: ProfitBreakdownProps) {
  const t = useT();

  // Calculate all values in AED
  const purchasePriceAED = useMemo(() => {
    return purchaseCurrency === 'AED' ? purchasePrice : purchasePrice * purchaseRate;
  }, [purchasePrice, purchaseCurrency, purchaseRate]);

  const totalCost = useMemo(() => {
    return purchasePriceAED + directExpenses + overheadExpenses;
  }, [purchasePriceAED, directExpenses, overheadExpenses]);

  const profit = useMemo(() => {
    if (!soldPrice) return null;
    return soldPrice - totalCost - commission;
  }, [soldPrice, totalCost, commission]);

  const margin = useMemo(() => {
    if (!soldPrice || soldPrice === 0) return null;
    return ((profit || 0) / soldPrice) * 100;
  }, [profit, soldPrice]);

  const roi = useMemo(() => {
    if (totalCost === 0) return null;
    return ((profit || 0) / totalCost) * 100;
  }, [profit, totalCost]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Text path="profit.costBreakdown" fallback="Xarajatlar tarkibi" />
          </h3>
          <Badge variant="info" size="md">
            {formatCurrency(totalCost)} AED
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Purchase Price */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  <Text path="profit.purchasePrice" fallback="Xarid narxi" />
                </div>
                <div className="text-xs text-gray-600">
                  {formatCurrency(purchasePrice)} {purchaseCurrency}
                  {purchaseCurrency !== 'AED' && ` × ${purchaseRate}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(purchasePriceAED)}
              </div>
              <div className="text-xs text-gray-500">AED</div>
            </div>
          </div>

          {/* Direct Expenses */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  <Text path="profit.directExpenses" fallback="To'g'ridan-to'g'ri xarajatlar" />
                </div>
                <div className="text-xs text-gray-600">
                  <Text path="profit.directExpensesDesc" fallback="Transport, ta'mir, detalling" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(directExpenses)}
              </div>
              <div className="text-xs text-gray-500">AED</div>
            </div>
          </div>

          {/* Overhead Expenses */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  <Text path="profit.overheadExpenses" fallback="Umumiy xarajatlar" />
                </div>
                <div className="text-xs text-gray-600">
                  <Text path="profit.overheadExpensesDesc" fallback="Ijara, oylik, reklama" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(overheadExpenses)}
              </div>
              <div className="text-xs text-gray-500">AED</div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
            <div className="text-base font-semibold text-gray-900">
              <Text path="profit.totalCost" fallback="Jami tan narx" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(totalCost)} AED
            </div>
          </div>
        </div>

        {/* Cost Composition Chart */}
        <div className="mt-4">
          <div className="text-xs text-gray-600 mb-2">
            <Text path="profit.costComposition" fallback="Xarajatlar tarkibi" />
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500" 
              style={{ width: `${(purchasePriceAED / totalCost) * 100}%` }}
              title={`${t('profit.purchasePrice', 'Xarid')}: ${((purchasePriceAED / totalCost) * 100).toFixed(1)}%`}
            />
            <div 
              className="bg-orange-500" 
              style={{ width: `${(directExpenses / totalCost) * 100}%` }}
              title={`${t('profit.directExpenses', 'To\'g\'ri xarajat')}: ${((directExpenses / totalCost) * 100).toFixed(1)}%`}
            />
            <div 
              className="bg-purple-500" 
              style={{ width: `${(overheadExpenses / totalCost) * 100}%` }}
              title={`${t('profit.overheadExpenses', 'Umumiy')}: ${((overheadExpenses / totalCost) * 100).toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{((purchasePriceAED / totalCost) * 100).toFixed(1)}%</span>
            <span>{((directExpenses / totalCost) * 100).toFixed(1)}%</span>
            <span>{((overheadExpenses / totalCost) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Profit Breakdown (only if sold) */}
      {status === 'sold' && soldPrice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              <Text path="profit.profitBreakdown" fallback="Foyda hisob-kitobi" />
            </h3>
            <Badge 
              variant={profit && profit >= 0 ? 'success' : 'danger'} 
              size="md"
            >
              {profit !== null ? `${profit >= 0 ? '+' : ''}${formatCurrency(profit)} AED` : '—'}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Sale Price */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  <Text path="profit.salePrice" fallback="Sotuv narxi" />
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">
                +{formatCurrency(soldPrice)} AED
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  <Text path="profit.totalCost" fallback="Jami tan narx" />
                </div>
              </div>
              <div className="text-lg font-bold text-red-600">
                -{formatCurrency(totalCost)} AED
              </div>
            </div>

            {/* Commission */}
            {commission > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    <Text path="profit.commission" fallback="Komissiya" />
                  </div>
                </div>
                <div className="text-lg font-bold text-yellow-600">
                  -{formatCurrency(commission)} AED
                </div>
              </div>
            )}

            {/* Net Profit */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              profit && profit >= 0 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="text-base font-semibold text-gray-900">
                <Text path="profit.netProfit" fallback="Sof foyda" />
              </div>
              <div className={`text-2xl font-bold ${
                profit && profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profit !== null ? `${profit >= 0 ? '+' : ''}${formatCurrency(profit)} AED` : '—'}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Margin */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">
                <Text path="profit.margin" fallback="Marja" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  margin && margin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                </span>
                <Badge 
                  variant={margin && margin >= 20 ? 'success' : margin && margin >= 10 ? 'warning' : 'danger'}
                  size="sm"
                >
                  {margin && margin >= 20 ? t('profit.excellent', 'A\'lo') : 
                   margin && margin >= 10 ? t('profit.good', 'Yaxshi') : 
                   t('profit.low', 'Past')}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <Text path="profit.marginDesc" fallback="Sotuv narxidan" />
              </div>
            </div>

            {/* ROI */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">
                <Text path="profit.roi" fallback="ROI" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  roi && roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {roi !== null ? `${roi.toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <Text path="profit.roiDesc" fallback="Investitsiyadan" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

