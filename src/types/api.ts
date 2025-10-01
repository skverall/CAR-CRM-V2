// =====================================================
// API TYPE DEFINITIONS
// Stable contracts for all API responses
// =====================================================

// =====================================================
// 1. DASHBOARD TYPES
// =====================================================

export interface DashboardKPIs {
  profit_total_aed: number;
  avg_margin_pct: number;
  median_days_to_sell: number;
  inventory_counts: {
    in_transit: number;
    for_sale: number;
    reserved: number;
    sold: number;
    archived: number;
  };
}

export interface TopProfitCar {
  id: string;
  vin: string;
  make: string;
  model: string;
  profit_aed: number;
  margin_pct: number;
  days_on_lot: number;
}

export interface BrandDistribution {
  brand: string;
  count: number;
  avg_profit_aed: number;
  avg_margin_pct: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  top_profit_cars: TopProfitCar[];
  loss_cars: TopProfitCar[];
  brand_distribution: BrandDistribution[];
  period_start: string;
  period_end: string;
}

// =====================================================
// 2. CAR LISTING TYPES
// =====================================================

export interface CarListItem {
  id: string;
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  status: 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived';
  purchase_date: string;
  // Financial fields for list row widget
  purchase_currency?: string;
  purchase_rate_to_aed?: number;
  purchase_price?: number; // original amount in purchase_currency
  purchase_price_aed?: number | null;
  purchase_component_aed?: number; // from car_cost_view
  car_expenses_component_aed?: number; // from car_cost_view
  overhead_component_aed?: number; // from car_cost_view
  cost_base_aed: number;
  sold_price_aed: number | null;
  profit_aed: number | null;
  margin_pct: number | null;
  days_on_lot: number | null;
  decision_tag: 'take' | 'skip' | null;
}

export interface CarListResponse {
  cars: CarListItem[];
  total_count: number;
  filters_applied: {
    status?: string[];
    brand?: string[];
    margin_range?: [number, number];
    date_range?: [string, string];
    only_losses?: boolean;
  };
}

// =====================================================
// 3. CAR DETAILS TYPES
// =====================================================

export interface CostBreakdown {
  purchase_component_aed: number;
  car_expenses_component_aed: number;
  overhead_component_aed: number;
  total_cost_aed: number;
}

export interface CarExpense {
  id: string;
  occurred_at: string;
  amount_aed: number;
  currency: string;
  category: string;
  description: string | null;
  attachment_id: string | null;
}

export interface CarDocument {
  id: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  original_name: string;
  created_at: string;
  signed_url?: string;
}

export interface CarDeal {
  id: string;
  buyer_name: string | null;
  channel: string | null;
  sold_price_aed: number;
  sold_date: string;
  commission_aed: number;
  agent_id: string | null;
}

export interface CarDetails {
  id: string;
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  status: string;
  purchase_date: string;
  purchase_price_aed: number;
  purchase_currency: string;
  mileage: number | null;
  notes: string | null;
  decision_tag: 'take' | 'skip' | null;
  
  // Cost and profit information
  cost_breakdown: CostBreakdown;
  profit_aed: number | null;
  margin_pct: number | null;
  roi_pct: number | null;
  days_on_lot: number | null;
  
  // Related data
  expenses: CarExpense[];
  documents: CarDocument[];
  deal: CarDeal | null;
  
  // Timeline events
  timeline: Array<{
    date: string;
    event: string;
    description: string;
    amount_aed?: number;
  }>;
}

// =====================================================
// 4. EXPENSE MANAGEMENT TYPES
// =====================================================

export interface ExpenseInput {
  occurred_at: string;
  amount: number;
  currency: string;
  rate_to_aed: number;
  scope: 'car' | 'overhead' | 'personal';
  category: 'purchase' | 'transport' | 'repair' | 'detailing' | 'ads' | 'fees' | 'fuel' | 'parking' | 'rent' | 'salary' | 'other';
  description?: string;
  car_id?: string;
  attachment_file?: File;
}

export interface ExpenseResponse {
  id: string;
  occurred_at: string;
  amount_aed: number;
  scope: string;
  category: string;
  description: string | null;
  car_vin: string | null;
  allocation_preview?: {
    method: string;
    affected_cars: Array<{
      vin: string;
      allocation_ratio: number;
      allocated_amount_aed: number;
    }>;
  };
}

// =====================================================
// 5. DEAL PROCESSING TYPES
// =====================================================

export interface DealInput {
  car_id: string;
  buyer_name?: string;
  channel?: string;
  sold_price_aed: number;
  sold_date: string;
  commission_aed?: number;
  agent_id?: string;
}

export interface DealResponse {
  id: string;
  car_id: string;
  profit_aed: number;
  margin_pct: number;
  roi_pct: number;
  days_on_lot: number;
  updated_car_status: string;
}

// =====================================================
// 6. OVERHEAD ALLOCATION TYPES
// =====================================================

export interface OverheadRule {
  id: string;
  method: 'per_car' | 'per_day_on_lot' | 'per_value_share';
  default_ratio: number;
  active_from: string;
  active_to: string | null;
}

export interface AllocationPreview {
  expense_amount_aed: number;
  method: string;
  allocations: Array<{
    car_vin: string;
    car_make: string;
    car_model: string;
    allocation_ratio: number;
    allocated_amount_aed: number;
  }>;
}

// =====================================================
// 7. IMPORT/EXPORT TYPES
// =====================================================

export interface ImportPreview {
  total_rows: number;
  valid_rows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  sample_data: Array<Record<string, unknown>>;
}

export interface ExportOptions {
  type: 'cars' | 'expenses' | 'profit_report';
  format: 'csv' | 'excel';
  date_range?: [string, string];
  filters?: Record<string, unknown>;
}

// =====================================================
// 8. COMMON RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

// =====================================================
// 9. FILTER AND SEARCH TYPES
// =====================================================

export interface CarFilters {
  status?: string[];
  brand?: string[];
  model?: string[];
  year_range?: [number, number];
  margin_range?: [number, number];
  profit_range?: [number, number];
  date_range?: [string, string];
  only_losses?: boolean;
  decision_tag?: ('take' | 'skip')[];
}

export interface SearchParams {
  query?: string;
  filters?: CarFilters;
  sort_by?: 'purchase_date' | 'profit_aed' | 'margin_pct' | 'days_on_lot';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}
