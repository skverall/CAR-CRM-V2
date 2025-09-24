'use client'

import { useState } from 'react'
import { Car } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { CarsTable } from '@/components/cars/CarsTable'
import { CarForm } from '@/components/cars/CarForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export default function CarsPage() {
  const { profile } = useAuth()
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')

  const canManage = profile?.role === 'owner' || profile?.role === 'assistant'

  const handleCreateCar = () => {
    setSelectedCar(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  const handleEditCar = (car: Car) => {
    setSelectedCar(car)
    setFormMode('edit')
    setIsFormOpen(true)
  }

  const handleViewCar = (car: Car) => {
    setSelectedCar(car)
    setFormMode('view')
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedCar(null)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setSelectedCar(null)
  }

  const getDialogTitle = () => {
    switch (formMode) {
      case 'create':
        return 'Добавить автомобиль'
      case 'edit':
        return 'Редактировать автомобиль'
      case 'view':
        return 'Просмотр автомобиля'
      default:
        return 'Автомобиль'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Автомобили</h1>
          <p className="text-gray-600 mt-2">
            Управление автопарком и учет автомобилей
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreateCar}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить автомобиль
          </Button>
        )}
      </div>

      <CarsTable
        onEditCar={handleEditCar}
        onViewCar={handleViewCar}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          {formMode === 'view' && selectedCar ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">VIN номер</label>
                  <p className="font-mono">{selectedCar.vin}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Марка</label>
                  <p>{selectedCar.brand}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Модель</label>
                  <p>{selectedCar.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Год выпуска</label>
                  <p>{selectedCar.year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Статус</label>
                  <p>{selectedCar.status === 'active' ? 'Активен' : 'Продан'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Цена покупки</label>
                  <p>{selectedCar.purchase_price ? `$${selectedCar.purchase_price}` : '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Дата покупки</label>
                  <p>{selectedCar.purchase_date || '—'}</p>
                </div>
                {selectedCar.status === 'sold' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Цена продажи</label>
                      <p>{selectedCar.sale_price ? `$${selectedCar.sale_price}` : '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Дата продажи</label>
                      <p>{selectedCar.sale_date || '—'}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleFormCancel}>Закрыть</Button>
              </div>
            </div>
          ) : (
            <CarForm
              car={selectedCar || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
