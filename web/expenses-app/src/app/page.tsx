import Link from 'next/link'

export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <p>Перейти к списку расходов и дашборду:</p>
      <ul className="list-disc list-inside">
        <li><Link href="/expenses">Список расходов</Link></li>
        <li><Link href="/dashboard">Дашборд</Link></li>
      </ul>
    </main>
  )
}
