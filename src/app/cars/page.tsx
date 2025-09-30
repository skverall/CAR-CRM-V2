import Text from "@/app/components/i18n/Text";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import StatusFilter from "@/app/components/cars/StatusFilter";
import CarsTable from "@/app/components/cars/CarsTable";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = 'force-dynamic';

type CarRow = {
  id: string;
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  status: 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived' | 'available' | 'repair' | 'listed';
  purchase_date: string;
  purchase_price_aed: number | null;
  cost_base_aed: number;
  sold_price_aed: number | null;
  profit_aed: number | null;
  margin_pct: number | null;
  days_on_lot: number | null;
};

async function getOrgId(): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? null;
}

async function fetchCars(orgId: string, statusParam?: string): Promise<CarRow[]> {
  const qs = new URLSearchParams({ org_id: orgId, per_page: '200' });
  if (statusParam) qs.set('status', statusParam);
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/cars?${qs.toString()}`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load cars');
  return (json.data.cars as CarRow[]);
}


export default async function CarsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const orgId = await getOrgId();
  const cars = orgId ? await fetchCars(orgId, searchParams?.status) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            <Text path="cars.title" fallback="Avtomobillar" />
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <Text path="cars.subtitle" fallback="Barcha avtomobillar ro'yxati va ularning holati" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusFilter />
          <Link
            href="/cars/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <Text path="cars.addNew" fallback="Yangi qo'shish" />
          </Link>
        </div>
      </div>

      {/* Table with sorting, search, and pagination */}
      <CarsTable cars={cars} orgId={orgId} />
    </div>
  );
}
