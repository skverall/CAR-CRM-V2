'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TransactionWithCar, TransactionType } from '@/types'

interface TransactionsResponse {
  transactions: TransactionWithCar[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface TransactionsFilters {
  type?: TransactionType
  category?: string
  carId?: string
  startDate?: string
  endDate?: string
  isPersonal?: boolean
  page?: number
  limit?: number
}

interface CreateTransactionData {
  type: TransactionType
  category: string
  amount: number
  currency?: string
  description?: string
  date: string
  carId?: string
  isPersonal?: boolean
}

interface UpdateTransactionData {
  type?: TransactionType
  category?: string
  amount?: number
  currency?: string
  description?: string
  date?: string
  carId?: string
  isPersonal?: boolean
}

// Fetch transactions with filters
export function useTransactions(filters: TransactionsFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionsResponse> => {
      const params = new URLSearchParams()
      
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.carId) params.append('carId', filters.carId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.isPersonal !== undefined) params.append('isPersonal', filters.isPersonal.toString())
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/transactions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      return response.json()
    },
  })
}

// Fetch single transaction
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<{ transaction: TransactionWithCar }> => {
      const response = await fetch(`/api/transactions/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction')
      }
      
      return response.json()
    },
    enabled: !!id,
  })
}

// Create transaction mutation
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionData): Promise<{ transaction: TransactionWithCar }> => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Update transaction mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionData }): Promise<{ transaction: TransactionWithCar }> => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update transaction')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Delete transaction mutation
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
