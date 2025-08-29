export type VehicleRow = {
  id: string
  vin: string | null
  make: string
  model: string
  year: number
  status: 'On Sale' | 'Sold' | 'Reserved' | 'In Transit'
  date_purchased: string
  list_price: string | null
  sold_price: string | null
  date_sold: string | null
  purchase_price: string
  total_cost: string
  roi: string | null
  market_avg: string | null
  market_margin: string | null
  investor_name: string
  investor_id: string
}

export type InvestorPositionRow = {
  investor_id: string
  name: string
  initial_investment: string
  realized_pl: string
  returned_capital: string
  extra_income: string
  capital_in_stock: string
  current_deposit_net: string
  other_expenses: string
  total_money: string
  money_bank: string | null
  money_cash: string | null
}

export type ExpenseRow = {
  id: string
  vehicle_id: string | null
  investor_id: string | null
  date: string
  description: string | null
  amount: string
  category: string
  notes: string | null
}

