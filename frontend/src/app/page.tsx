'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogoIcon } from '@/components/ui/logo'

export default function SplashPage() {
  const [ready, setReady] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (ready && status !== 'loading') {
      if (session) router.replace('/dashboard')
      else router.replace('/login')
    }
  }, [ready, status, session, router])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-6">
      <div className="animate-pulse-slow">
        <LogoIcon size={96} />
      </div>
      <div className="text-center">
        <p className="text-2xl font-black tracking-tight text-foreground">
          PRO{' '}
          <span style={{ background: 'linear-gradient(90deg,#1655C0,#00C8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DIGITALIX
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-widest">Analysez • Optimisez • Développez</p>
      </div>
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
