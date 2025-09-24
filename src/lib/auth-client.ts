"use client"

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { UserRole } from '@/types'

export const createClient = () => createBrowserClient<Database>()

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

