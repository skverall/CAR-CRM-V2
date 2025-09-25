'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialChart } from '@/components/reports/FinancialChart'
import { ProfitDistributionCard } from '@/components/profit/ProfitDistributionCard'
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react'
import {useTranslations} from 'next-intl'

export default function ReportsPage() {
  const t = useTranslations()
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('reports.subtitle')}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          {t('reports.export')}
        </Button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
              {t('reports.cards.financial')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {t('reports.descriptions.financial')}
            </p>
            <Button variant="outline" className="w-full">
              {t('reports.open')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-green-600" />
              {t('reports.cards.cars')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {t('reports.descriptions.cars')}
            </p>
            <Button variant="outline" className="w-full">
              {t('reports.open')}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              {t('reports.cards.profitDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {t('reports.descriptions.profitDistribution')}
            </p>
            <Button variant="outline" className="w-full">
              {t('reports.open')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('reports.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="trends">{t('reports.tabs.trends')}</TabsTrigger>
          <TabsTrigger value="categories">{t('reports.tabs.categories')}</TabsTrigger>
          <TabsTrigger value="profit">{t('reports.tabs.profit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart
              type="line"
              title={t('reports.charts.monthlyTrends')}
              dataType="monthly"
              height={350}
            />
            <FinancialChart
              type="pie"
              title={t('reports.charts.byCategories')}
              dataType="categories"
              height={350}
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FinancialChart
              type="line"
              title={t('reports.charts.incomeExpenseTrends')}
              dataType="monthly"
              height={400}
            />
            <FinancialChart
              type="bar"
              title={t('reports.charts.monthlyCompare')}
              dataType="monthly"
              height={350}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart
              type="bar"
              title={t('reports.charts.expensesByCategory')}
              dataType="categories"
              height={400}
            />
            <FinancialChart
              type="pie"
              title={t('reports.charts.categoryShareExpenses')}
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
                  {t('reports.charts.profitDynamics')}
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
