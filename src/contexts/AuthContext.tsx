'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/auth-client'
import { User as UserProfile, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching profile for user:', userId)

      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error)
        // Не блокируем авторизацию из-за ошибок профиля
        // Пользователь может войти, но без профиля
        return null
      }

      console.log('[AuthContext] Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('[AuthContext] Exception fetching profile:', error)
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData as any)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    const getInitialSession = async () => {
      console.log('[AuthContext] Getting initial session...')

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthContext] Error getting session:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('[AuthContext] Found existing session for:', session.user.email)
          setUser(session.user)

          // Загружаем профиль асинхронно, не блокируя авторизацию
          fetchProfile(session.user.id).then(profileData => {
            setProfile(profileData as any)
          })
        }
      } catch (error) {
        console.error('[AuthContext] Exception getting initial session:', error)
      }

      setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session?.user?.email)

        if (session?.user) {
          setUser(session.user)

          // Загружаем профиль асинхронно, не блокируя авторизацию
          fetchProfile(session.user.id).then(profileData => {
            setProfile(profileData as any)
          })
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return { user: null, profile: null, loading: true, hasAccess: false }
  }

  if (!user || !profile) {
    return { user: null, profile: null, loading: false, hasAccess: false }
  }

  const hasAccess = requiredRoles ? requiredRoles.includes(profile.role) : true

  return { user, profile, loading: false, hasAccess }
}
