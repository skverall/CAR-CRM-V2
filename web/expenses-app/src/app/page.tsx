import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <h1>Расходы</h1>
      <p>Быстрые ссылки по разделам:</p>
      <ul>
        <li><Link href="/expenses">Список расходов</Link></li>
        <li><Link href="/dashboard">Сводка</Link></li>
        <li><Link href="/investors">Инвесторы</Link></li>
      </ul>
    </main>
  )
}

