import NextAuth from 'next-auth'
import type { DefaultSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

export const config = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl))
      }
      return true
    },
  },
}

export const { auth, signIn, signOut } = NextAuth(config) 