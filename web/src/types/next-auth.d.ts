import NextAuth, { DefaultSession } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
  }
}
