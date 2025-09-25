import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const supabase = createServerClient()

    // Check if this is the first user
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = count === 0
    const role = isFirstUser ? 'owner' : 'assistant'

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: validatedData.fullName,
        role: role,
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile in public.users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: role,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in POST /api/auth/register:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
