"use client";

import { useMemo } from "react";
import Text from "@/app/components/i18n/Text";
import Badge from "@/app/components/ui/Badge";

type ProfitDataPoint = {
  date: string;
  profit: number;
  margin: number;
  carName: string;
};

type ProfitChartProps = {
  data: ProfitDataPoint[];
  title?: string;
};

export default function ProfitChart({ data, title }: ProfitChartProps) {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const totalProfit = data.reduce((sum, d) => sum + d.profit, 0);
    const avgProfit = totalProfit / data.length;
    const avgMargin = data.reduce((sum, d) => sum + d.margin, 0) / data.length;
    const maxProfit = Math.max(...data.map(d => d.profit));
    const minProfit = Math.min(...data.map(d => d.profit));
    const profitableCars = data.filter(d => d.profit > 0).length;
    const lossCars = data.filter(d => d.profit < 0).length;

    return {
      totalProfit,
      avgProfit,
      avgMargin,
      maxProfit,
      minProfit,
      profitableCars,
      lossCars,
      totalCars: data.length,
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const maxAbsProfit = Math.max(...data.map(d => Math.abs(d.profit)));
    const scale = maxAbsProfit > 0 ? 100 / maxAbsProfit : 1;

    return data.map(d => ({
      ...d,
      heightPercent: Math.abs(d.profit) * scale,
      isPositive: d.profit >= 0,
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (!stats || !chartData) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">
            <Text path="analytics.noData" fallback="Ma'lumot yo'q" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          {title || <Text path="analytics.profitOverTime" fallback="Foyda dinamikasi" />}
        </h3>
        <Badge variant={stats.totalProfit >= 0 ? 'success' : 'danger'} size="lg">
          {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)} AED
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cars */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">
            <Text path="analytics.totalCars" fallback="Jami avtomobillar" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalCars}</div>
          <div className="text-xs text-blue-600 mt-1">
            <span className="text-green-600">{stats.profitableCars} <Text path="analytics.profitable" fallback="foydali" /></span>
            {stats.lossCars > 0 && (
              <span className="text-red-600 ml-2">{stats.lossCars} <Text path="analytics.loss" fallback="zarar" /></span>
            )}
          </div>
        </div>

        {/* Average Profit */}
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 font-medium mb-1">
            <Text path="analytics.avgProfit" fallback="O'rtacha foyda" />
          </div>
          <div className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {stats.avgProfit >= 0 ? '+' : ''}{formatCurrency(stats.avgProfit)}
          </div>
          <div className="text-xs text-green-600 mt-1">AED</div>
        </div>

        {/* Average Margin */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-xs text-purple-600 font-medium mb-1">
            <Text path="analytics.avgMargin" fallback="O'rtacha marja" />
          </div>
          <div className={`text-2xl font-bold ${stats.avgMargin >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
            {stats.avgMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {stats.avgMargin >= 20 ? (
              <Text path="analytics.excellent" fallback="A'lo" />
            ) : stats.avgMargin >= 10 ? (
              <Text path="analytics.good" fallback="Yaxshi" />
            ) : (
              <Text path="analytics.needsImprovement" fallback="Yaxshilash kerak" />
            )}
          </div>
        </div>

        {/* Best/Worst */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="text-xs text-orange-600 font-medium mb-1">
            <Text path="analytics.range" fallback="Diapason" />
          </div>
          <div className="text-sm">
            <div className="text-green-600 font-semibold">
              ↑ {formatCurrency(stats.maxProfit)}
            </div>
            <div className="text-red-600 font-semibold">
              ↓ {formatCurrency(stats.minProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          <Text path="analytics.profitByDate" fallback="Sanalar bo'yicha foyda" />
        </div>
        
        {/* Chart Container */}
        <div className="relative h-64 bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <div className="flex items-end justify-around h-full min-w-full gap-2">
            {chartData.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-1 min-w-[60px] group">
                {/* Bar */}
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  {/* Profit value on hover */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {point.carName}<br/>
                    {point.isPositive ? '+' : ''}{formatCurrency(point.profit)} AED<br/>
                    {point.margin.toFixed(1)}%
                  </div>
                  
                  {/* Bar element */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                      point.isPositive 
                        ? 'bg-gradient-to-t from-green-500 to-green-400' 
                        : 'bg-gradient-to-t from-red-500 to-red-400'
                    }`}
                    style={{ height: `${point.heightPercent}%` }}
                  />
                </div>
                
                {/* Date label */}
                <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                  {new Date(point.date).toLocaleDateString('uz-UZ', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
            <span><Text path="analytics.profit" fallback="Foyda" /></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded"></div>
            <span><Text path="analytics.loss" fallback="Zarar" /></span>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {stats.profitableCars > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            <Text path="analytics.topPerformers" fallback="Eng foydali sotuvlar" />
          </div>
          <div className="space-y-2">
            {chartData
              .filter(d => d.isPositive)
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 3)
              .map((point, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{point.carName}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(point.date).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      +{formatCurrency(point.profit)} AED
                    </div>
                    <div className="text-xs text-gray-600">
                      {point.margin.toFixed(1)}% <Text path="analytics.margin" fallback="marja" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Loss Cars Warning */}
      {stats.lossCars > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-red-900">
                <Text path="analytics.lossWarning" fallback="Zarar ko'rgan avtomobillar" />
              </div>
              <div className="text-xs text-red-700 mt-1">
                {stats.lossCars} <Text path="analytics.carsWithLoss" fallback="ta avtomobil zarar bilan sotilgan" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

