import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z
    .string()
    .min(1)
    .default('AED'),
  NEXT_PUBLIC_LOCALE: z
    .string()
    .min(1)
    .default('en-AE'),
})

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
  NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
})

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors)
  throw new Error('Environment validation failed')
}

export const env = parsed.data
export const publicEnv = {
  NEXT_PUBLIC_DEFAULT_CURRENCY: env.NEXT_PUBLIC_DEFAULT_CURRENCY,
  NEXT_PUBLIC_LOCALE: env.NEXT_PUBLIC_LOCALE,
}
