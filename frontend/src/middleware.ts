import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin uniquement
    if (pathname.startsWith('/admin') && token?.role !== 'admin' && token?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Routes publiques
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
        if (publicPaths.some((p) => pathname.startsWith(p))) return true
        // Toutes les autres routes nécessitent un token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
