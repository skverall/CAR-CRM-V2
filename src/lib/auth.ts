import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { UserRole } from '@/types'

export const createClient = () => createClientComponentClient<Database>()

export const createServerClient = () => createServerComponentClient<Database>({ cookies })

export async function getUser() {
  const supabase = createServerClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      ...user,
      profile
    }
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

    if (error || !data) {
      return null
    }

    return data.role as UserRole
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole = 'assistant') {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  return { error }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  return { data, error }
}

export async function updatePassword(password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.updateUser({
    password,
  })

  return { data, error }
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
