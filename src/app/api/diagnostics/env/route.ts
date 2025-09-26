import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mask(val?: string) {
  if (!val) return null
  const v = String(val)
  if (v.length <= 8) return `${'*'.repeat(Math.max(0, v.length - 2))}${v.slice(-2)}`
  return `${v.slice(0, 2)}***${v.slice(-4)}`
}

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: {
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      sample: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      sample: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      sample: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    NODE_ENV: process.env.NODE_ENV || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
  }

  return NextResponse.json({ ok: true, env })
}

