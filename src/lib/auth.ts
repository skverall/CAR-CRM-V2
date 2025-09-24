import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { UserRole } from '@/types'

export const createServerClient = () =>
  createSupabaseServerClient<Database>({ cookies })

export async function getUser() {
  const supabase = createServerClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return null
    }
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
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
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
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
