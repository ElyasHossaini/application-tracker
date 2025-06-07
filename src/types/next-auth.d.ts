import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isFirstLogin: boolean
      phone?: string
    } & DefaultSession['user']
  }

  interface User {
    isFirstLogin: boolean
    phone?: string
  }
} 