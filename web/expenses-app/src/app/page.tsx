import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <h1>Expenses</h1>
      <p>Перейти к списку расходов и дашборду:</p>
      <ul>
        <li><Link href="/expenses">Список расходов</Link></li>
        <li><Link href="/dashboard">Дашборд</Link></li>
      </ul>
    </main>
  )
}
