import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { type NextAuthOptions, getServerSession } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import nodemailer from 'nodemailer'
import { UserRole } from '@prisma/client'

import { env } from '@/lib/env'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export type SessionUser = {
  id: string
  role: UserRole
  email?: string | null
  name?: string | null
}

const transport = env.EMAIL_SERVER_HOST
  ? nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: env.EMAIL_SERVER_PORT ?? 587,
      secure: (env.EMAIL_SERVER_PORT ?? 587) === 465,
      auth:
        env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD
          ? {
              user: env.EMAIL_SERVER_USER,
              pass: env.EMAIL_SERVER_PASSWORD,
            }
          : undefined,
    })
  : nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const { host } = new URL(url)
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from ?? env.EMAIL_FROM,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n\n${url}\n`,
          html: `<p>Sign in to <strong>${host}</strong></p><p><a href="${url}">${url}</a></p>`,
        })

        if (process.env.NODE_ENV !== 'production') {
          const previewUrl = nodemailer.getTestMessageUrl?.(result)
          console.log('Magic link sent to %s', identifier)
          console.log('Sign-in URL:', url)
          if (previewUrl) console.log('Preview URL:', previewUrl)
        }
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/sign-in',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
  },
}

export const getCurrentSession = () => getServerSession(authOptions)

export async function requireRole(roles: UserRole | UserRole[]): Promise<SessionUser> {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const session = await getCurrentSession()

  if (!session?.user) {
    throw new AppError('Unauthorized', { status: 401 })
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new AppError('Forbidden', { status: 403 })
  }

  return session.user
}
