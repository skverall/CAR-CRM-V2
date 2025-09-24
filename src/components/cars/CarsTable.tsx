'use client'

import { useState } from 'react'
import { Car, CarStatus } from '@/types'
import { useCars, useDeleteCar } from '@/hooks/useCars'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, Trash2, MoreHorizontal, Eye, Loader2 } from 'lucide-react'

interface CarsTableProps {
  onEditCar?: (car: Car) => void
  onViewCar?: (car: Car) => void
}

export function CarsTable({ onEditCar, onViewCar }: CarsTableProps) {
  const { profile } = useAuth()
  const [filters, setFilters] = useState({
    search: '',
    status: '' as CarStatus | '',
    page: 1,
    limit: 10,
  })

  const { data, isLoading, error } = useCars(filters as any)
  const deleteCarMutation = useDeleteCar()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handleStatusFilter = (status: CarStatus | '') => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDeleteCar = async (car: Car) => {
    if (!confirm(`Вы уверены, что хотите удалить автомобиль ${car.brand} ${car.model}?`)) {
      return
    }

    try {
      await deleteCarMutation.mutateAsync(car.id)
    } catch (error) {
      console.error('Error deleting car:', error)
    }
  }

  const canManage = profile?.role === 'owner' || profile?.role === 'assistant'
  const canDelete = profile?.role === 'owner'

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Ошибка при загрузке автомобилей: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск по VIN, марке или модели..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filters.status} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="sold">Проданные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>VIN</TableHead>
              <TableHead>Автомобиль</TableHead>
              <TableHead>Год</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Цена покупки</TableHead>
              <TableHead>Дата покупки</TableHead>
              <TableHead>Цена продажи</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Загрузка...</p>
                </TableCell>
              </TableRow>
            ) : data?.cars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-sm text-gray-500">Автомобили не найдены</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-mono text-sm">
                    {car.vin}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{car.brand} {car.model}</p>
                    </div>
                  </TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell>
                    <Badge variant={car.status === 'active' ? 'default' : 'secondary'}>
                      {car.status === 'active' ? 'Активен' : 'Продан'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {car.purchase_price ? formatCurrency(car.purchase_price) : '—'}
                  </TableCell>
                  <TableCell>
                    {car.purchase_date ? formatDate(car.purchase_date) : '—'}
                  </TableCell>
                  <TableCell>
                    {car.sale_price ? formatCurrency(car.sale_price) : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewCar?.(car)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                        {canManage && (
                          <DropdownMenuItem onClick={() => onEditCar?.(car)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCar(car)}
                            className="text-red-600"
                            disabled={deleteCarMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Показано {data.cars.length} из {data.pagination.total} автомобилей
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
            >
              Назад
            </Button>
            <span className="text-sm">
              Страница {filters.page} из {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= data.pagination.totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
