'use client'

import { useState } from 'react'
import { TransactionWithCar, TransactionType } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { ProfitDistributionCard } from '@/components/profit/ProfitDistributionCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Filter } from 'lucide-react'

export default function TransactionsPage() {
  const { profile } = useAuth()
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCar | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')

  const canManage = profile?.role === 'owner' || profile?.role === 'assistant'

  const handleCreateTransaction = () => {
    setSelectedTransaction(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  const handleEditTransaction = (transaction: TransactionWithCar) => {
    setSelectedTransaction(transaction)
    setFormMode('edit')
    setIsFormOpen(true)
  }

  const handleViewTransaction = (transaction: TransactionWithCar) => {
    setSelectedTransaction(transaction)
    setFormMode('view')
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedTransaction(null)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setSelectedTransaction(null)
  }

  const getDialogTitle = () => {
    switch (formMode) {
      case 'create':
        return 'Добавить транзакцию'
      case 'edit':
        return 'Редактировать транзакцию'
      case 'view':
        return 'Просмотр транзакции'
      default:
        return 'Транзакция'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Транзакции</h1>
          <p className="text-gray-600 mt-2">
            Учет доходов и расходов по автомобилям
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Фильтры
          </Button>
          {canManage && (
            <Button onClick={handleCreateTransaction}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить транзакцию
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Transactions Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Список транзакций</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsTable
                onEditTransaction={handleEditTransaction}
                onViewTransaction={handleViewTransaction}
              />
            </CardContent>
          </Card>
        </div>

        {/* Profit Distribution */}
        <div className="lg:col-span-1">
          <ProfitDistributionCard />
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          {formMode === 'view' && selectedTransaction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Тип</label>
                  <p>{selectedTransaction.type === 'income' ? 'Доход' : 'Расход'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Категория</label>
                  <p>{selectedTransaction.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Сумма</label>
                  <p>{selectedTransaction.amount} {selectedTransaction.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Дата</label>
                  <p>{selectedTransaction.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Автомобиль</label>
                  <p>{selectedTransaction.car ? `${selectedTransaction.car.brand} ${selectedTransaction.car.model}` : 'Общие расходы'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Личный расход</label>
                  <p>{selectedTransaction.is_personal ? 'Да' : 'Нет'}</p>
                </div>
              </div>
              {selectedTransaction.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Описание</label>
                  <p>{selectedTransaction.description}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleFormCancel}>Закрыть</Button>
              </div>
            </div>
          ) : (
            <TransactionForm
              transaction={selectedTransaction || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
