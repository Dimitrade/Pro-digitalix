'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            retry: 1,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(222 47% 11%)',
              color: 'hsl(213 31% 91%)',
              border: '1px solid hsl(222 47% 18%)',
              borderRadius: '0.625rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: 'hsl(142 71% 45%)', secondary: 'hsl(222 47% 11%)' },
            },
            error: {
              iconTheme: { primary: 'hsl(0 84% 60%)', secondary: 'hsl(222 47% 11%)' },
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
