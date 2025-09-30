"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import StatusBadge from "@/app/components/ui/StatusBadge";
import Badge from "@/app/components/ui/Badge";
import CarsCards from "./CarsCards";
import { useT } from "@/app/i18n/LangContext";

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

type SortKey = keyof CarRow | '';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';

type Props = {
  cars: CarRow[];
  orgId: string | null;
};

export default function CarsTable({ cars, orgId }: Props) {
  const t = useT();
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sorting logic
  const sortedCars = useMemo(() => {
    if (!sortKey) return cars;
    
    const sorted = [...cars].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      
      return String(aVal).localeCompare(String(bVal));
    });
    
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [cars, sortKey, sortDir]);

  // Search filtering
  const filteredCars = useMemo(() => {
    if (!searchQuery) return sortedCars;
    
    const query = searchQuery.toLowerCase();
    return sortedCars.filter(car => 
      car.vin.toLowerCase().includes(query) ||
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.status.toLowerCase().includes(query)
    );
  }, [sortedCars, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCars.slice(start, start + itemsPerPage);
  }, [filteredCars, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDir === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('cars.search', 'Qidiruv: VIN, marka, model...')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">
            <Text path="cars.view" fallback="Ko'rinish:" />
          </span>
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          <Text path="cars.showing" fallback="Ko'rsatilmoqda:" /> {paginatedCars.length} / {filteredCars.length}
          {searchQuery && ` (${cars.length} dan)`}
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th 
                    onClick={() => handleSort('make')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Text path="cars.table.car" fallback="Avtomobil" />
                      <SortIcon column="make" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Text path="cars.table.status" fallback="Holat" />
                      <SortIcon column="status" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('purchase_date')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Text path="cars.table.purchaseDate" fallback="Xarid sanasi" />
                      <SortIcon column="purchase_date" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('purchase_price_aed')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Text path="cars.table.purchasePrice" fallback="Xarid narxi" /> (AED)
                      <SortIcon column="purchase_price_aed" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('profit_aed')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Text path="cars.table.profit" fallback="Foyda" />
                      <SortIcon column="profit_aed" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('margin_pct')}
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Text path="cars.table.margin" fallback="Marja" />
                      <SortIcon column="margin_pct" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Text path="cars.table.actions" fallback="Amallar" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCars.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">
                          {searchQuery ? t('cars.noResults', 'Hech narsa topilmadi') : t('cars.empty', 'Hech qanday avtomobil topilmadi')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCars.map((car, index) => (
                    <tr key={car.id} className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-4">
                        <Link href={`/cars/${car.id}`} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform">
                            {car.make?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                              {car.make} {car.model} {car.model_year ?? ''}
                            </div>
                            <div className="text-gray-500 text-xs font-mono">
                              VIN: {car.vin}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={car.status}>
                          <Text path={`status.${car.status}`} fallback={car.status} />
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(car.purchase_date).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                        {car.purchase_price_aed != null ? `${car.purchase_price_aed.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {car.profit_aed != null ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className={`text-sm font-semibold ${car.profit_aed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">AED</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">
                        {car.margin_pct != null ? (
                          <Badge 
                            variant={car.margin_pct >= 20 ? 'success' : car.margin_pct >= 10 ? 'warning' : 'danger'}
                            size="sm"
                          >
                            {car.margin_pct.toFixed(1)}%
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/cars/${car.id}?edit=1`}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t("common.edit", "Tahrirlash")}
                          </Link>
                          <Link
                            href={`/cars/${car.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                          >
                            <Text path="cars.table.view" fallback="Ko'rish" />
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <CarsCards cars={paginatedCars} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Text path="pagination.previous" fallback="Oldingi" />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Text path="pagination.next" fallback="Keyingi" />
          </button>
        </div>
      )}
    </div>
  );
}

