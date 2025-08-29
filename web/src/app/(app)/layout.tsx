import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-white/80 sticky top-0 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4 text-sm">
          <Link className="hover:underline" href="/vehicles">Vehicles</Link>
          <Link className="hover:underline" href="/expenses">Expenses</Link>
          <Link className="hover:underline" href="/investors">Investors</Link>
          <Link className="hover:underline" href="/import">Import</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  )
}

