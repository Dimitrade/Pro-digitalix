import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const { data } = await axios.post(`${API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          })
          return {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name,
            avatar_url: data.user.avatar_url,
            role: data.user.role,
            plan: data.user.plan,
            is_verified: data.user.is_verified,
            accessToken: data.token,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth: synchroniser avec notre backend
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const { data } = await axios.post(`${API_URL}/auth/oauth/callback`, {
            provider: account.provider,
            provider_id: account.providerAccountId,
            email: user.email,
            full_name: user.name,
            avatar_url: user.image,
            access_token: account.access_token,
          })
          user.id = data.user.id
          user.role = data.user.role
          user.plan = data.user.plan
          user.is_verified = data.user.is_verified
          user.accessToken = data.token
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.full_name = user.full_name ?? user.name
        token.role = user.role
        token.plan = user.plan
        token.is_verified = user.is_verified
        token.accessToken = user.accessToken
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id
      session.user.full_name = token.full_name as string
      session.user.role = token.role
      session.user.plan = token.plan
      session.user.is_verified = token.is_verified
      session.accessToken = token.accessToken
      return session
    },
  },
}
