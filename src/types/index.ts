import { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']
export type Car = Database['public']['Tables']['cars']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Capital = Database['public']['Tables']['capital']['Row']
export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export type UserRole = 'owner' | 'investor' | 'assistant'
export type CarStatus = 'active' | 'sold'
export type TransactionType = 'income' | 'expense'

export interface TransactionWithCar extends Transaction {
  car?: Car | null
}

export interface CarWithTransactions extends Car {
  transactions?: Transaction[]
  total_income?: number
  total_expenses?: number
  profit?: number
}

export interface DashboardStats {
  totalCars: number
  activeCars: number
  soldCars: number
  totalIncome: number
  totalExpenses: number
  totalProfit: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyProfit: number
}

export interface ProfitDistribution {
  totalProfit: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  investorPercentage?: number
  ownerPercentage?: number
  assistantPercentage?: number
}

export interface CapitalState {
  id?: string
  totalCapital: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  updatedAt?: string
}

export interface ProfitDistributionBreakdown {
  totalIncome: number
  businessExpenses: number
  personalExpenses: number
  totalExpenses: number
  netProfit: number
}

export interface DistributionRules {
  investor: number // percentage
  owner: number    // percentage
  assistant: number // percentage
}

export interface PeriodDistribution {
  totalIncome: number
  totalBusinessExpenses: number
  totalPersonalExpenses: number
  netProfit: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  transactionCount: number
}

export interface MonthlyProfitSummary {
  month: string
  totalIncome: number
  totalBusinessExpenses: number
  totalPersonalExpenses: number
  netProfit: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  transactionCount: number
}

export interface CarProfitDistribution {
  carId: string
  carVin: string
  carBrand: string
  carModel: string
  carYear: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
  investorShare: number
  ownerShare: number
  assistantShare: number
  transactionCount: number
}

export interface CapitalHistoryEntry {
  id: string
  action: string
  timestamp: string
  user: {
    id: string
    email: string
    fullName: string
    role: string
  } | null
  changes: {
    before: CapitalState | null
    after: CapitalState | null
  }
  metadata?: {
    recalculationTrigger?: string
    transactionCount?: number
    totalIncome?: number
    totalExpenses?: number
  }
}

export interface TransactionCategory {
  income: string[]
  expense: string[]
}

export const TRANSACTION_CATEGORIES: TransactionCategory = {
  income: [
    'Продажа автомобиля',
    'Аренда',
    'Лизинг',
    'Страховая выплата',
    'Прочие доходы'
  ],
  expense: [
    'Покупка автомобиля',
    'Ремонт и обслуживание',
    'Топливо',
    'Страховка',
    'Налоги и сборы',
    'Парковка',
    'Штрафы',
    'Личные расходы',
    'Прочие расходы'
  ]
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UZS', name: 'Uzbek Som', symbol: 'сўм' },
] as const

export type CurrencyCode = typeof CURRENCIES[number]['code']
