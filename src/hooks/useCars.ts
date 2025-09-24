'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, CarStatus } from '@/types'

interface CarsResponse {
  cars: Car[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CarsFilters {
  status?: CarStatus
  search?: string
  page?: number
  limit?: number
}

interface CreateCarData {
  vin: string
  brand: string
  model: string
  year: number
  purchasePrice?: number
  purchaseDate?: string
}

interface UpdateCarData {
  vin?: string
  brand?: string
  model?: string
  year?: number
  status?: CarStatus
  purchasePrice?: number
  purchaseDate?: string
  salePrice?: number
  saleDate?: string
}

// Fetch cars with filters
export function useCars(filters: CarsFilters = {}) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async (): Promise<CarsResponse> => {
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/cars?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch cars')
      }
      
      return response.json()
    },
  })
}

// Fetch single car
export function useCar(id: string) {
  return useQuery({
    queryKey: ['car', id],
    queryFn: async (): Promise<{ car: Car }> => {
      const response = await fetch(`/api/cars/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch car')
      }
      
      return response.json()
    },
    enabled: !!id,
  })
}

// Create car mutation
export function useCreateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCarData): Promise<{ car: Car }> => {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create car')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch cars
      queryClient.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

// Update car mutation
export function useUpdateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCarData }): Promise<{ car: Car }> => {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update car')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch cars
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car', id] })
    },
  })
}

// Delete car mutation
export function useDeleteCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete car')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch cars
      queryClient.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}
