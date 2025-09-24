'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push(redirectTo)
        return
      }

      if (requiredRoles && !requiredRoles.includes(profile.role)) {
        router.push('/dashboard') // Redirect to dashboard if no permission
        return
      }
    }
  }, [user, profile, loading, requiredRoles, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  if (requiredRoles && !requiredRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
