'use client'

import { useState } from 'react'
import { TransactionWithCar, TransactionType } from '@/types'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
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
import { Edit, Trash2, MoreHorizontal, Eye, Loader2, Search, Filter } from 'lucide-react'
import {useTranslations} from 'next-intl'

interface TransactionsTableProps {
  onEditTransaction?: (transaction: TransactionWithCar) => void
  onViewTransaction?: (transaction: TransactionWithCar) => void
}

export function TransactionsTable({ onEditTransaction, onViewTransaction }: TransactionsTableProps) {
  const { profile } = useAuth()
  const t = useTranslations()
  const [filters, setFilters] = useState({
    search: '',
    type: '' as TransactionType | '',
    category: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  })

  const { data, isLoading, error } = useTransactions(filters as any)
  const deleteTransactionMutation = useDeleteTransaction()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handleTypeFilter = (type: TransactionType | '') => {
    setFilters(prev => ({ ...prev, type, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm(t('transactions.confirmDelete'))) {
      try {
        await deleteTransactionMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const canEdit = profile?.role === 'owner' || profile?.role === 'assistant'
  const canDelete = profile?.role === 'owner'

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('transactions.loadError', {message: error.message})}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.type} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('transactions.filter.type.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('transactions.filter.type.all')}</SelectItem>
            <SelectItem value="income">{t('transactions.filter.type.income')}</SelectItem>
            <SelectItem value="expense">{t('transactions.filter.type.expense')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          {t('common.filters')}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions.table.headers.date')}</TableHead>
              <TableHead>{t('transactions.table.headers.type')}</TableHead>
              <TableHead>{t('transactions.table.headers.category')}</TableHead>
              <TableHead>{t('transactions.table.headers.description')}</TableHead>
              <TableHead>{t('transactions.table.headers.car')}</TableHead>
              <TableHead>{t('transactions.table.headers.amount')}</TableHead>
              <TableHead>{t('transactions.table.headers.currency')}</TableHead>
              <TableHead>{t('transactions.table.headers.personal')}</TableHead>
              <TableHead className="w-[100px]">{t('transactions.table.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">{t('common.loading')}</p>
                </TableCell>
              </TableRow>
            ) : data?.transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-gray-500">{t('transactions.empty')}</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                      {transaction.type === 'income' ? t('transactions.typeLabel.income') : t('transactions.typeLabel.expense')}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell>
                    {transaction.car ? (
                      <span className="text-sm">
                        {transaction.car.brand} {transaction.car.model} ({transaction.car.year})
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.currency}</TableCell>
                  <TableCell>
                    {transaction.is_personal ? (
                      <Badge variant="outline">{t('transactions.personal')}</Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewTransaction?.(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEditTransaction?.(transaction)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
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
            {t('transactions.pagination.summary', {count: data.transactions.length, total: data.pagination.total})}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
            >
              {t('common.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= data.pagination.totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
