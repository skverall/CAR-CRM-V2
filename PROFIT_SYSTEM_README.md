# Car CRM Profit Calculation System

Comprehensive profit calculation and cost tracking system for car dealership CRM with automatic overhead allocation, multi-organization support, and real-time profit analytics.

## 🎯 Key Features

### ✅ Implemented Features

- **Single Source of Truth**: All profit/cost calculations use immutable database views
- **Automatic Overhead Allocation**: Three allocation methods (per_car, per_day_on_lot, per_value_share)
- **Multi-Organization Support**: Complete RLS policies for secure multi-tenant access
- **Real-time Profit Tracking**: Instant profit visibility on dashboard and car listings
- **Mobile-First Expense Entry**: Quick expense entry with photo upload and allocation preview
- **Comprehensive Dashboard**: KPIs, top/loss cars, brand distribution, recent activity
- **Cost Breakdown**: Detailed cost components (purchase, car expenses, overhead allocation)
- **Document Management**: Secure file storage with signed URLs and organization-based access

### 🔧 Technical Architecture

- **Database Views**: `car_cost_view`, `car_profit_view`, `inventory_view` as single source of truth
- **Overhead Distribution**: Automatic allocation with configurable rules and batch processing
- **API Contracts**: Stable TypeScript interfaces for all endpoints
- **Row Level Security**: Complete multi-organization access control
- **File Storage**: Private Supabase storage with signed URL access

## 🚀 Quick Start

### 1. Deploy Database Schema

```bash
# Install dependencies
npm install

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE="your-service-role-key"

# Deploy database changes
node scripts/deploy-database.mjs
```

### 2. Update Your Application

Replace your existing pages with the enhanced versions:

```bash
# Use the new dashboard
cp src/app/page.tsx src/app/page-old.tsx
# The new dashboard is already in src/app/page.tsx

# Use the enhanced car listing
cp src/app/cars/enhanced-page.tsx src/app/cars/page.tsx
```

### 3. Add Quick Expense Entry

Add the QuickExpenseEntry component to your layout:

```tsx
import QuickExpenseEntry from '@/app/components/QuickExpenseEntry';

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <QuickExpenseEntry orgId="your-org-id" />
    </div>
  );
}
```

## 📊 Dashboard Features

### KPI Metrics
- **Total Profit**: Sum of all sold car profits in selected period
- **Average Margin**: Average profit margin percentage
- **Median Days to Sell**: Median time from purchase to sale
- **Inventory Status**: Real-time counts by car status

### Profit Analysis
- **Top Profit Cars**: Best performing vehicles with profit and margin
- **Loss Cars**: Vehicles that lost money with detailed breakdown
- **Brand Distribution**: Performance analysis by car manufacturer

### Recent Activity
- Real-time feed of purchases, sales, and expenses
- Visual indicators for different transaction types
- Quick access to related car details

## 🚗 Car Management

### Enhanced Car Listing
- **Profit Visibility**: Instant profit/loss display for all cars
- **Cost Breakdown**: Detailed cost components (purchase + expenses + overhead)
- **Status Tracking**: Visual status badges with color coding
- **Decision Tags**: Take/skip indicators for investment decisions
- **Filtering**: By status, brand, profit range, margin range

### Car Details Page
- **Cost Components**: Purchase price, direct expenses, allocated overhead
- **Profit Metrics**: Profit amount, margin %, ROI %, days on lot
- **Expense Timeline**: Chronological view of all car-related expenses
- **Document Management**: Secure file storage and access
- **Deal Management**: Sale transaction details and commission tracking

## 💰 Expense Management

### Quick Mobile Entry
- **Floating Action Button**: Always accessible expense entry
- **Smart Categorization**: Pre-defined expense categories
- **Photo Upload**: Attach receipts and documents
- **Allocation Preview**: See how overhead expenses will be distributed
- **Auto-completion**: Car selection with VIN search

### Overhead Allocation Methods

#### Per Car Method
- Divides overhead expenses equally among active cars
- Best for: Fixed costs like rent, insurance, salaries

#### Per Day on Lot Method  
- Allocates based on how many days each car was in inventory
- Best for: Time-based costs like storage, utilities

#### Per Value Share Method
- Distributes based on purchase price proportion
- Best for: Value-based costs like financing, insurance premiums

### Allocation Rules
```sql
-- Create allocation rule
INSERT INTO overhead_rules (org_id, method, active_from) 
VALUES ('org-id', 'per_car', '2024-01-01');

-- Preview allocation
SELECT * FROM preview_overhead_allocation('org-id', 1000.00, '2024-01-15');

-- Apply allocations
SELECT apply_overhead_allocation('org-id', '2024-01-01', '2024-01-31');
```

## 🔐 Security & Access Control

### Row Level Security (RLS)
- **Organization Isolation**: Users only see their organization's data
- **Role-Based Access**: Owner/Manager/Viewer permissions
- **Secure Documents**: Private storage with signed URL access

### User Roles
- **Owner**: Full access, can manage users and settings
- **Manager**: Can create/edit cars, expenses, deals
- **Viewer**: Read-only access to data and reports

## 📈 Profit Calculation Logic

### Cost Components
```sql
-- Total cost = Purchase + Direct Expenses + Allocated Overhead
SELECT 
  purchase_component_aed,
  car_expenses_component_aed,
  overhead_component_aed,
  total_cost_aed
FROM car_cost_view 
WHERE id = 'car-id';
```

### Profit Calculation
```sql
-- Profit = Sale Price - Total Cost - Commission
SELECT 
  sold_price_aed,
  total_cost_aed,
  commission_aed,
  profit_aed,
  margin_pct,
  roi_pct
FROM car_profit_view 
WHERE id = 'car-id';
```

### Key Metrics
- **Profit Amount**: `sold_price - total_cost - commission`
- **Margin %**: `(profit / sold_price) * 100`
- **ROI %**: `(profit / total_cost) * 100`
- **Days on Lot**: `sold_date - purchase_date`

## 🔧 API Endpoints

### Dashboard
```typescript
GET /api/dashboard?org_id=xxx&start_date=2024-01-01&end_date=2024-01-31
// Returns: KPIs, top/loss cars, brand distribution
```

### Cars
```typescript
GET /api/cars?org_id=xxx&status=for_sale&sort_by=profit_aed
POST /api/cars // Create new car
GET /api/cars/[id] // Car details with cost breakdown
PATCH /api/cars/[id] // Update car
```

### Expenses
```typescript
GET /api/expenses?org_id=xxx&scope=overhead
POST /api/expenses // Create expense with file upload
POST /api/expenses/preview-allocation // Preview overhead allocation
```

### Deals
```typescript
POST /api/deals // Record car sale
GET /api/deals?org_id=xxx // List deals
```

## 🧪 Testing

### Database Functions
```sql
-- Test cost calculation
SELECT au_car_cost_aed('car-id');

-- Test profit calculation  
SELECT au_car_profit_aed_v2('car-id');

-- Test allocation preview
SELECT * FROM preview_overhead_allocation('org-id', 1000, '2024-01-15');
```

### API Testing
```bash
# Test dashboard
curl "http://localhost:3000/api/dashboard?org_id=default-org"

# Test car creation
curl -X POST "http://localhost:3000/api/cars" \
  -H "Content-Type: application/json" \
  -d '{"vin":"TEST123","make":"Toyota","model":"Camry",...}'
```

## 📋 Acceptance Criteria Checklist

- ✅ Same car shows identical cost/profit across all screens
- ✅ New expenses immediately reflect in cost calculations
- ✅ Overhead expenses distribute per active allocation rule
- ✅ Dashboard totals match individual car sums
- ✅ All actions require ≤3 clicks for typical workflows
- ✅ Mobile expense entry works smoothly
- ✅ Document upload and secure access functional
- ✅ RLS policies prevent cross-organization access

## 🚀 Deployment Checklist

1. **Database Migration**
   - [ ] Run `node scripts/deploy-database.mjs`
   - [ ] Verify all views are created
   - [ ] Test allocation functions

2. **Application Updates**
   - [ ] Replace dashboard page
   - [ ] Update car listing page
   - [ ] Add QuickExpenseEntry component
   - [ ] Configure organization context

3. **Testing**
   - [ ] Create test car and expenses
   - [ ] Verify profit calculations
   - [ ] Test overhead allocation
   - [ ] Validate RLS policies

4. **Production Setup**
   - [ ] Configure proper authentication
   - [ ] Set up user organization assignments
   - [ ] Configure overhead allocation rules
   - [ ] Set up document storage bucket

## 🔄 Migration from Existing System

The new system is designed to work alongside your existing `au_*` tables. The migration:

1. **Extends existing tables** with new fields (org_id, scope, category, etc.)
2. **Preserves existing data** while adding new functionality
3. **Maintains backward compatibility** with existing profit calculations
4. **Adds new views** as single source of truth for UI

Your existing data will be automatically migrated and enhanced with the new profit calculation system.

## 📞 Support

For questions or issues:
1. Check the database views are properly created
2. Verify RLS policies are active
3. Test allocation functions with sample data
4. Review API response formats match TypeScript interfaces

The system is designed to be the definitive solution for car dealership profit tracking with automatic overhead allocation and real-time visibility.
