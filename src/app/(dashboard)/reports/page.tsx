'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialChart } from '@/components/reports/FinancialChart'
import { ProfitDistributionCard } from '@/components/profit/ProfitDistributionCard'
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react'

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

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="trends">Тренды</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="profit">Прибыль</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart
              type="line"
              title="Финансовые тренды по месяцам"
              dataType="monthly"
              height={350}
            />
            <FinancialChart
              type="pie"
              title="Распределение по категориям"
              dataType="categories"
              height={350}
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FinancialChart
              type="line"
              title="Детальные тренды доходов и расходов"
              dataType="monthly"
              height={400}
            />
            <FinancialChart
              type="bar"
              title="Сравнение по месяцам"
              dataType="monthly"
              height={350}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart
              type="bar"
              title="Расходы по категориям"
              dataType="categories"
              height={400}
            />
            <FinancialChart
              type="pie"
              title="Доля категорий в общих расходах"
              dataType="categories"
              height={400}
            />
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitDistributionCard />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Динамика прибыли
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialChart
                  type="line"
                  title=""
                  dataType="monthly"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
