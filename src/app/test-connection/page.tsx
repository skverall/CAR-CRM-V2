'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {useTranslations} from 'next-intl'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TestConnectionPage() {
  const t = useTranslations()
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [tables, setTables] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('testing')
      setError(null)

      // Тест 1: Проверяем подключение
      console.log('🔗 Тестируем подключение к Supabase...')
      
      // Тест 2: Проверяем таблицы
      console.log('📊 Проверяем таблицы...')
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('count', { count: 'exact', head: true })

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('count', { count: 'exact', head: true })

      const { data: exchangeRatesData, error: exchangeRatesError } = await supabase
        .from('exchange_rates')
        .select('count', { count: 'exact', head: true })

      if (carsError || usersError || transactionsError || exchangeRatesError) {
        throw new Error('Ошибка доступа к таблицам')
      }

      // Тест 3: Проверяем представления
      console.log('📈 Проверяем представления...')
      const { data: dashboardStats, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()

      if (statsError) {
        console.warn('Предупреждение при получении статистики:', statsError)
      }

      // Тест 4: Проверяем курсы валют
      console.log('💱 Проверяем курсы валют...')
      const { data: rates, error: ratesError } = await supabase
        .from('exchange_rates')
        .select('*')
        .limit(5)

      setTables([
        { name: 'cars', count: carsData?.length || 0 },
        { name: 'users', count: usersData?.length || 0 },
        { name: 'transactions', count: transactionsData?.length || 0 },
        { name: 'exchange_rates', count: rates?.length || 0 }
      ])

      setStats(dashboardStats)
      setConnectionStatus('success')
      
      console.log('✅ Все тесты пройдены успешно!')
      
    } catch (err) {
      console.error('❌ Ошибка тестирования:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      setConnectionStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              {t('testConnection.title')}
            </h1>

            {/* Статус подключения */}
            <div className="mb-8 text-center">
              {connectionStatus === 'testing' && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-lg">{t('testConnection.testing')}</span>
                </div>
              )}
              
              {connectionStatus === 'success' && (
                <div className="text-green-600">
                  <div className="text-6xl mb-4">✅</div>
                  <div className="text-xl font-semibold">{t('testConnection.successTitle')}</div>
                  <div className="text-gray-600 mt-2">{t('testConnection.successSubtitle')}</div>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="text-red-600">
                  <div className="text-6xl mb-4">❌</div>
                  <div className="text-xl font-semibold">{t('testConnection.errorTitle')}</div>
                  <div className="text-gray-600 mt-2">{error}</div>
                  <button 
                    onClick={testConnection}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('testConnection.retry')}
                  </button>
                </div>
              )}
            </div>

            {/* Информация о таблицах */}
            {tables.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('testConnection.tablesTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tables.map((table) => (
                    <div key={table.name} className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium text-gray-900">{table.name}</div>
                      <div className="text-2xl font-bold text-blue-600">{table.count}</div>
                      <div className="text-sm text-gray-500">{t('testConnection.records')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Статистика дашборда */}
            {stats && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('testConnection.dashboardStatsTitle')}</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Конфигурация */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">{t('testConnection.configTitle')}</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Supabase URL:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Anon Key:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="border-t pt-6 text-center">
              <div className="space-x-4">
                <button 
                  onClick={testConnection}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {`🔄 ${t('testConnection.retry')}`}
                </button>
                <a 
                  href="/auth/register"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
                >
                  {`👤 ${t('auth.register.title')}`}
                </a>
                <a 
                  href="/dashboard"
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 inline-block"
                >
                  {`🏠 ${t('testConnection.gotoDashboard')}`}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
