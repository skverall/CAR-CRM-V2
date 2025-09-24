'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardStats, ProfitDistribution, CarWithTransactions } from '@/types'

interface MonthlyTrend {
  month: string
  total_income: number
  total_expenses: number
  net_profit: number
  personal_expenses: number
  transaction_count: number
  cars_involved: number
}

interface CategoryBreakdown {
  type: 'income' | 'expense'
  category: string
  transaction_count: number
  total_amount: number
  average_amount: number
  min_amount: number
  max_amount: number
  first_transaction: string
  last_transaction: string
}

interface DashboardData {
  stats: DashboardStats
  profitDistribution: ProfitDistribution
  monthlyTrends: MonthlyTrend[]
  categoryBreakdown: CategoryBreakdown[]
  topCars: CarWithTransactions[]
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch('/api/dashboard/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
