import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/layout/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  )
}
