import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import Card from "@/app/components/ui/Card";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getCounts() {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("au_cars")
    .select("status")
    .neq("status", "archived");
  const rows = data || [];
  const byStatus = rows.reduce((acc: Record<string, number>, r: { status: string }) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = rows.length;
  const inTransit = byStatus["in_transit"] || 0;
  const sold = byStatus["sold"] || 0;
  const reserved = byStatus["reserved"] || 0;
  const forSale = (byStatus["for_sale"] || 0) + (byStatus["listed"] || 0);
  const garage = (byStatus["available"] || 0) + (byStatus["repair"] || 0);

  return { total, inTransit, garage, forSale, sold, reserved };
}

export default async function Dashboard() {
  const counts = await getCounts();

  const cards: Array<{
    key: string;
    href: string;
    color: string;
    icon: string;
    value: number;
    dictPath: string;
  }> = [
    { key: "total", href: "/cars", color: "bg-sky-500", icon: "🚗", value: counts.total, dictPath: "dashboard.cards.total" },
    { key: "in_transit", href: "/cars?status=in_transit", color: "bg-blue-500", icon: "📦", value: counts.inTransit, dictPath: "dashboard.cards.in_transit" },
    { key: "garage", href: "/cars?status=available,repair", color: "bg-amber-500", icon: "🛠️", value: counts.garage, dictPath: "dashboard.cards.garage" },
    { key: "for_sale", href: "/cars?status=for_sale,listed", color: "bg-green-500", icon: "🛒", value: counts.forSale, dictPath: "dashboard.cards.for_sale" },
    { key: "sold", href: "/cars?status=sold", color: "bg-purple-600", icon: "✅", value: counts.sold, dictPath: "dashboard.cards.sold" },
    { key: "reserved", href: "/cars?status=reserved", color: "bg-yellow-600", icon: "⏸️", value: counts.reserved, dictPath: "dashboard.cards.reserved" },
  ];

  return (
    <div className="grid gap-6 p-6">
      <h1 className="text-3xl font-bold"><Text path="dashboard.title" fallback="Панель управления" /></h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="block group">
            <Card className="p-4 transition-shadow group-hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${c.color}`} aria-hidden>
                  <span className="text-lg">{c.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold leading-none">{c.value}</div>
                  <div className="text-sm text-gray-600">
                    <Text path={c.dictPath} fallback={c.key} />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
