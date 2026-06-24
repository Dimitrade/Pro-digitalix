'use client'

import { useQuery } from '@tanstack/react-query'
import { chariowApi } from '@/lib/api'

export interface ChariowAccount {
  id: string
  store_name: string
  store_slug: string
  store_url: string
  currency: string
  sync_status: string
  last_sync_at: string | null
}

export function useChariowAccounts() {
  return useQuery({
    queryKey: ['chariow-accounts'],
    queryFn: async () => {
      const data = await chariowApi.accounts()
      return (data?.accounts ?? data) as ChariowAccount[]
    },
    staleTime: 60_000,
  })
}
