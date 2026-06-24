import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      id: string
      email: string
      full_name: string
      avatar_url: string | null
      role: string
      plan: string
      is_verified: boolean
    }
  }

  interface User {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
    role: string
    plan: string
    is_verified: boolean
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    plan: string
    is_verified: boolean
    accessToken: string
  }
}
