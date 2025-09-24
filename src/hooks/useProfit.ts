'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProfitDistribution, CapitalState, CapitalHistoryEntry } from '@/types'

interface ProfitDistributionResponse {
  totalProfit: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  investorPercentage: number
  ownerPercentage: number
  assistantPercentage: number
  lastUpdated: string
}

interface EnhancedProfitResponse {
  periodDistribution: {
    totalIncome: number
    totalBusinessExpenses: number
    totalPersonalExpenses: number
    netProfit: number
    investorShare: number
    ownerShare: number
    assistantShare: number
    transactionCount: number
  }
  currentCapitalState: {
    totalCapital: number
    investorShare: number
    ownerShare: number
    assistantShare: number
    lastUpdated: string
  }
  summary: {
    profitMargin: number
    expenseRatio: number
    personalExpenseRatio: number
    averageTransactionValue: number
    isPositiveProfit: boolean
  }
  monthlySummary?: Array<{
    month: string
    totalIncome: number
    totalBusinessExpenses: number
    totalPersonalExpenses: number
    netProfit: number
    investorShare: number
    ownerShare: number
    assistantShare: number
    transactionCount: number
  }>
  carDistribution?: Array<{
    carId: string
    carVin: string
    carBrand: string
    carModel: string
    carYear: number
    totalIncome: number
    totalExpenses: number
    netProfit: number
    investorShare: number
    ownerShare: number
    assistantShare: number
    transactionCount: number
  }>
}

// Get basic profit distribution
export function useProfitDistribution() {
  return useQuery({
    queryKey: ['profit-distribution'],
    queryFn: async (): Promise<ProfitDistributionResponse> => {
      const response = await fetch('/api/profit-distribution')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profit distribution')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get enhanced profit distribution with analytics
export function useEnhancedProfitDistribution(options?: {
  startDate?: string
  endDate?: string
  includeMonthly?: boolean
  includeCars?: boolean
  monthsBack?: number
}) {
  return useQuery({
    queryKey: ['profit-distribution', 'enhanced', options],
    queryFn: async (): Promise<EnhancedProfitResponse> => {
      const params = new URLSearchParams()
      
      if (options?.startDate) params.append('startDate', options.startDate)
      if (options?.endDate) params.append('endDate', options.endDate)
      if (options?.includeMonthly) params.append('includeMonthly', 'true')
      if (options?.includeCars) params.append('includeCars', 'true')
      if (options?.monthsBack) params.append('monthsBack', options.monthsBack.toString())

      const response = await fetch(`/api/profit-distribution/enhanced?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch enhanced profit distribution')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get capital state
export function useCapitalState() {
  return useQuery({
    queryKey: ['capital'],
    queryFn: async (): Promise<CapitalState> => {
      const response = await fetch('/api/capital')
      
      if (!response.ok) {
        throw new Error('Failed to fetch capital state')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get capital history
export function useCapitalHistory(options?: {
  startDate?: string
  endDate?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['capital', 'history', options],
    queryFn: async (): Promise<{ history: CapitalHistoryEntry[] }> => {
      const params = new URLSearchParams()
      
      if (options?.startDate) params.append('startDate', options.startDate)
      if (options?.endDate) params.append('endDate', options.endDate)
      if (options?.limit) params.append('limit', options.limit.toString())

      const response = await fetch(`/api/capital/history?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch capital history')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Recalculate profit distribution
export function useRecalculateProfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<{ message: string; recalculatedAt: string }> => {
      const response = await fetch('/api/capital/recalculate', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to recalculate profit distribution')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch profit-related queries
      queryClient.invalidateQueries({ queryKey: ['profit-distribution'] })
      queryClient.invalidateQueries({ queryKey: ['capital'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Update capital manually (owner only)
export function useUpdateCapital() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      investorShare: number
      ownerShare: number
      assistantShare: number
      reason?: string
    }): Promise<{ message: string; capital: CapitalState }> => {
      const response = await fetch('/api/capital', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update capital')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch capital-related queries
      queryClient.invalidateQueries({ queryKey: ['capital'] })
      queryClient.invalidateQueries({ queryKey: ['profit-distribution'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
