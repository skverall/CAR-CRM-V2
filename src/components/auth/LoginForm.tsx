'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {useTranslations} from 'next-intl'

export function LoginForm() {
  const t = useTranslations()

  const loginSchema = z.object({
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(6, t('errors.passwordMin')),
  })

  type LoginFormData = z.infer<typeof loginSchema>
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    console.log('[Login] submit', { email: data.email })

    // Fallback in case the Supabase request hangs (network, protection, CSP, etc.)
    const timeoutMs = 12000
    const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
      setTimeout(() =>
        resolve({ data: null, error: { message: 'Login request timed out. Please try again.' } }),
      timeoutMs)
    })

    try {
      const result = await Promise.race([
        signIn(data.email, data.password),
        timeoutPromise,
      ])

      console.log('[Login] result', result)

      if (result?.error) {
        setError(result.error.message || 'Login error')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('[Login] unexpected error', err)
      setError(t('auth.login.errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('auth.login.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.login.email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.login.password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => router.push('/register')}
          disabled={isLoading}
        >
          {t('auth.login.noAccount')}
        </Button>
      </div>
    </div>
  )
}
