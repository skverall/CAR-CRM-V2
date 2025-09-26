export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Отчёты</h1>
      <div className="grid gap-2">
        <a className="underline text-blue-600" href="/api/export?type=cars">Скачать CSV — Авто</a>
        <a className="underline text-blue-600" href="/api/export?type=expenses">Скачать CSV — Расходы</a>
        <a className="underline text-blue-600" href="/api/export?type=incomes">Скачать CSV — Доходы</a>
        <a className="underline text-blue-600" href="/api/export?type=movements">Скачать CSV — Движение капитала</a>
      </div>
    </div>
  );
}

