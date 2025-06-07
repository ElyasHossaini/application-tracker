import NextAuth, { DefaultSession, User as DefaultUser, NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@/generated/prisma'
import { compare } from 'bcryptjs'

type UserExtension = {
  phone?: string | undefined
}

declare module "next-auth" {
  interface User extends UserExtension {}
  
  interface Session {
    user: {
      id: string
    } & UserExtension & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    phone?: string
  }
}

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('No user found with this email')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || undefined,
        } as any
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }
        })

        // If no user exists, allow sign in (new account)
        if (!existingUser) {
          return true
        }

        // If user exists and already has a Google account linked, allow sign in
        if (existingUser.accounts.some(acc => acc.provider === 'google')) {
          return true
        }

        // If user exists but doesn't have a Google account linked,
        // link the Google account
        if (account?.provider === 'google') {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          })
          return true
        }

        // For credentials provider, only allow if user has password
        if (account?.provider === 'credentials' && existingUser.password) {
          return true
        }

        return false
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.phone = user.phone
      }

      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          phone: token.phone,
        },
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 