export const dynamic = "force-dynamic";

import Card from "@/app/components/ui/Card";
import Text from "@/app/components/i18n/Text";

export default function ReportsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="reports.title" fallback="Hisobotlar" /></h1>
      <Card>
        <div className="grid gap-2">
          <a className="underline text-blue-600" href="/api/export?type=cars"><Text path="reports.export.carsCsv" fallback="CSV yuklab olish — Avtomobillar" /></a>
          <a className="underline text-blue-600" href="/api/export?type=expenses"><Text path="reports.export.expensesCsv" fallback="CSV yuklab olish — Xarajatlar" /></a>
          <a className="underline text-blue-600" href="/api/export?type=incomes"><Text path="reports.export.incomesCsv" fallback="CSV yuklab olish — Daromad" /></a>
          <a className="underline text-blue-600" href="/api/export?type=movements"><Text path="reports.export.movementsCsv" fallback="CSV yuklab olish — Kapital harakati" /></a>
          <a className="underline text-blue-600" href="/reports/daily-expenses"><Text path="reports.export.dailyExpenses" fallback="Kunlik xarajatlar (hisobot)" /></a>
        </div>
      </Card>
    </div>
  );
}

