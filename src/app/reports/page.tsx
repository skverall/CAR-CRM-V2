export const dynamic = "force-dynamic";

import Card from "@/app/components/ui/Card";

export default function ReportsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Hisobotlar</h1>
      <Card>
        <div className="grid gap-2">
          <a className="underline text-blue-600" href="/api/export?type=cars">CSV yuklab olish — Avtomobillar</a>
          <a className="underline text-blue-600" href="/api/export?type=expenses">CSV yuklab olish — Xarajatlar</a>
          <a className="underline text-blue-600" href="/api/export?type=incomes">CSV yuklab olish — Daromad</a>
          <a className="underline text-blue-600" href="/api/export?type=movements">CSV yuklab olish — Kapital harakati</a>
          <a className="underline text-blue-600" href="/reports/daily-expenses">Kunlik xarajatlar (hisobot)</a>
        </div>
      </Card>
    </div>
  );
}

