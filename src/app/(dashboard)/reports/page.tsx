'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, BarChart3, PieChart } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Отчёты и аналитика</h1>
          <p className="text-gray-600 mt-2">
            Детальная аналитика по автомобилям и финансам
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Экспорт данных
        </Button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
              Финансовый отчёт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Общий анализ доходов, расходов и прибыли по всем автомобилям
            </p>
            <Button variant="outline" className="w-full">
              Открыть отчёт
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-green-600" />
              Анализ по автомобилям
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Детальная прибыльность каждого автомобиля в автопарке
            </p>
            <Button variant="outline" className="w-full">
              Открыть отчёт
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              Распределение прибыли
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Расчёт долей инвестора, владельца и помощника
            </p>
            <Button variant="outline" className="w-full">
              Открыть отчёт
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Тренды по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              График будет отображаться здесь
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Категории расходов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Диаграмма категорий будет отображаться здесь
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
