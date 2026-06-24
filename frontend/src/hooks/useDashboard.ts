'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface DashboardMetrics {
  revenue: { today: number; week: number; month: number; total: number; currency: string }
  orders: { today: number; week: number; month: number; total: number }
  customers: { total: number; new_this_month: number; returning: number }
  conversion_rate: number
  average_order_value: number
  top_products: Array<{
    id: string; name: string; thumbnail_url: string | null
    total_sales: number; total_revenue: number; price: number; currency: string
  }>
  revenue_trend: Array<{ date: string; revenue: number; orders: number }>
}

export function useDashboard(accountId: string | null) {
  return useQuery({
    queryKey: ['dashboard', accountId],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/dashboard/${accountId}`)
      return data as DashboardMetrics
    },
    enabled: !!accountId,
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000, // refresh toutes les 5min
  })
}

export function useRevenueTrend(accountId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['revenue-trend', accountId, from, to],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/revenue/${accountId}`, { params: { from, to } })
      return data
    },
    enabled: !!accountId,
    staleTime: 5 * 60_000,
  })
}

// Hook pour les données live Chariow (sans cache local)
export function useChariowLive(accountId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['chariow-live', accountId, from, to],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/live/${accountId}`, { params: { from, to } })
      return data
    },
    enabled: !!accountId,
    staleTime: 3 * 60_000,
  })
}
