'use client'

import { useProfitDistribution, useRecalculateProfit } from '@/hooks/useProfit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import { Loader2, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react'

export function ProfitDistributionCard() {
  const { data, isLoading, error } = useProfitDistribution()
  const recalculateMutation = useRecalculateProfit()
  const { toast } = useToast()

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync()
      toast({
        title: "Успешно",
        description: "Распределение прибыли пересчитано",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось пересчитать распределение прибыли",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Распределение прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Распределение прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Ошибка при загрузке данных о прибыли: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const isPositiveProfit = data && data.totalProfit > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Распределение прибыли
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          disabled={recalculateMutation.isPending}
          className="h-8"
        >
          {recalculateMutation.isPending ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3 w-3" />
          )}
          Пересчитать
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Profit */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Общая прибыль</div>
          <div className={`text-2xl font-bold ${isPositiveProfit ? 'text-green-600' : 'text-red-600'}`}>
            {data ? formatCurrency(data.totalProfit) : '$0'}
          </div>
          <Badge variant={isPositiveProfit ? 'default' : 'destructive'} className="mt-2">
            {isPositiveProfit ? 'Прибыль' : 'Убыток'}
          </Badge>
        </div>

        {/* Distribution */}
        {data && (
          <div className="space-y-3">
            {/* Investor */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium">Инвестор</div>
                  <div className="text-sm text-gray-600">{data.investorPercentage}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">
                  {formatCurrency(data.investorShare)}
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium">Владелец</div>
                  <div className="text-sm text-gray-600">{data.ownerPercentage}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  {formatCurrency(data.ownerShare)}
                </div>
              </div>
            </div>

            {/* Assistant */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium">Помощник</div>
                  <div className="text-sm text-gray-600">{data.assistantPercentage}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-600">
                  {formatCurrency(data.assistantShare)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {data?.lastUpdated && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Обновлено: {new Date(data.lastUpdated).toLocaleString('ru-RU')}
          </div>
        )}

        {recalculateMutation.isPending && (
          <div className="text-xs text-blue-600 text-center pt-2">
            Пересчитываем распределение...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
