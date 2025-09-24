'use client'

import { useDashboardStats } from '@/hooks/useDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Car, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { data, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Загрузка статистики...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка при загрузке статистики: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = data?.stats
  const profitDistribution = data?.profitDistribution

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <p className="text-gray-600 mt-2">
          Добро пожаловать, {profile?.full_name || profile?.email}!
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего автомобилей</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCars || 0}</div>
            <p className="text-xs text-muted-foreground">
              Активных: {stats?.activeCars || 0}, Проданных: {stats?.soldCars || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              За месяц: {formatCurrency(stats?.monthlyIncome || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              За месяц: {formatCurrency(stats?.monthlyExpenses || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats?.totalProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              За месяц: {formatCurrency(stats?.monthlyProfit || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Distribution */}
      {profitDistribution && (stats?.totalProfit || 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Доля инвестора (50%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(profitDistribution.investor_share)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Доля владельца (25%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(profitDistribution.owner_share)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Доля помощника (25%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(profitDistribution.assistant_share)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Топ автомобили по прибыли</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topCars && data.topCars.length > 0 ? (
              <div className="space-y-4">
                {data.topCars.slice(0, 5).map((car) => (
                  <div key={car.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{car.brand} {car.model}</p>
                      <p className="text-sm text-gray-500">{car.vin}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${(car.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(car.net_profit || 0)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {car.transaction_count || 0} транзакций
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Нет данных для отображения</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Категории расходов</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.categoryBreakdown
                  .filter(cat => cat.type === 'expense')
                  .slice(0, 5)
                  .map((category) => (
                    <div key={category.category} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-gray-500">
                          {category.transaction_count} транзакций
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">
                          {formatCurrency(category.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Средняя: {formatCurrency(category.average_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">Нет данных для отображения</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
