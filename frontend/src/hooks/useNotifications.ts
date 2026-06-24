'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChariowAccounts } from './useChariowAccount'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, string>
  read_at: string | null
  archived_at: string | null
  created_at: string
}

// ── API helpers ──

const notifApi = {
  list: (accountId: string) =>
    api.get<{ notifications: AppNotification[]; unread: number }>(`/notifications/${accountId}`).then(r => r.data),
  markRead: (accountId: string, id: string) =>
    api.patch(`/notifications/${accountId}/${id}`).then(r => r.data),
  markAllRead: (accountId: string) =>
    api.patch(`/notifications/${accountId}/all`).then(r => r.data),
  archive: (accountId: string, id: string) =>
    api.delete(`/notifications/${accountId}/${id}`).then(r => r.data),
  registerToken: (accountId: string, fcm_token: string, platform: string) =>
    api.post(`/notifications/token/${accountId}`, { fcm_token, platform }).then(r => r.data),
}

// ── Hook principal ──

export function useNotifications() {
  const { data: accounts } = useChariowAccounts()
  const accountId = accounts?.[0]?.id
  const qc = useQueryClient()
  const tokenSent = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', accountId],
    queryFn: () => accountId ? notifApi.list(accountId) : null,
    enabled: !!accountId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notifApi.markRead(accountId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', accountId] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notifApi.markAllRead(accountId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', accountId] }),
  })

  const archiveNotif = useMutation({
    mutationFn: (id: string) => notifApi.archive(accountId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', accountId] }),
  })

  // Enregistrer le token FCM une seule fois par session
  useEffect(() => {
    if (!accountId || tokenSent.current) return
    async function register() {
      const token = await requestNotificationPermission()
      if (!token) return
      tokenSent.current = true
      const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios'
        : /Android/.test(navigator.userAgent) ? 'android' : 'web'
      await notifApi.registerToken(accountId!, token, platform).catch(() => {})
    }
    register()
  }, [accountId])

  // Toast pour les messages foreground
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      const { title = 'PRO DIGITALIX', body = '' } = payload.notification || {}
      toast(body, { icon: '🔔', duration: 5000 })
      qc.invalidateQueries({ queryKey: ['notifications', accountId] })
    })
    return unsub
  }, [accountId, qc])

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unread ?? 0,
    isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    archive: (id: string) => archiveNotif.mutate(id),
  }
}

export function useUnreadCount() {
  const { unreadCount } = useNotifications()
  return unreadCount
}
