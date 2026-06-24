'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface SubscriptionData {
  plan: 'free' | 'premium' | 'owner'
  premium: boolean
  premium_at: string | null
  premium_ends: string | null
  days_left: number | null
  checkout_url: string
}

export function useSubscription() {
  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscription/me').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const plan = data?.plan ?? 'free'
  const isPremium = data?.premium ?? false
  const isOwner = plan === 'owner'
  const daysLeft = data?.days_left ?? null

  return { data, isLoading, plan, isPremium, isOwner, daysLeft }
}
