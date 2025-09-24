import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { UserRole } from '@/types'

export const createServerClient = () =>
  createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
      },
    }
  )

export async function getUser() {
  const supabase = createServerClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return null
    }
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id' as any, user.id as any)
      .single()
    return { ...user, profile }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createServerClient()
  try {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id' as any, userId as any)
      .single()
    if (error || !data) return null
    return data.role as UserRole
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

export function canManageCars(userRole: UserRole): boolean {
  return hasPermission(userRole, ['owner', 'assistant'])
}

export function canManageTransactions(userRole: UserRole): boolean {
  return hasPermission(userRole, ['owner', 'assistant'])
}

export function canViewReports(userRole: UserRole): boolean {
  return hasPermission(userRole, ['owner', 'investor', 'assistant'])
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, ['owner'])
}

export function canExportData(userRole: UserRole): boolean {
  return hasPermission(userRole, ['owner', 'investor'])
}
