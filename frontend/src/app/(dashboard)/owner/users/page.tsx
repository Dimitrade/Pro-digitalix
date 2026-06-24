'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Crown, Sparkles, UserX, UserCheck,
  Gift, CalendarX, MoreHorizontal, RefreshCw, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface User {
  id: string; email: string; full_name: string; phone: string | null
  country: string | null; role: string; premium: boolean
  premium_at: string | null; premium_ends: string | null
  subscription_source: string | null; is_active: boolean
  login_count: number; last_active_at: string | null
  created_at: string; accounts_count: string
}

const SOURCE_LABELS: Record<string, string> = {
  chariow: 'Chariow', owner: 'Attribution OWNER',
  promotion: 'Promotion', lifetime: 'Lifetime', test: 'Test interne',
}

const SOURCE_COLORS: Record<string, string> = {
  chariow: 'bg-blue-500/10 text-blue-400',
  owner: 'bg-purple-500/10 text-purple-400',
  promotion: 'bg-orange-500/10 text-orange-400',
  lifetime: 'bg-yellow-500/10 text-yellow-400',
  test: 'bg-gray-500/10 text-gray-400',
}

const DURATIONS = [
  { label: '30 jours', value: '30' },
  { label: '90 jours', value: '90' },
  { label: '180 jours', value: '180' },
  { label: '365 jours', value: '365' },
  { label: 'À vie', value: 'lifetime' },
]

function PlanBadge({ premium, ends }: { premium: boolean; ends: string | null }) {
  const active = premium && (!ends || new Date(ends) > new Date())
  const isLifetime = ends && new Date(ends).getFullYear() > 9000
  if (isLifetime) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">LIFETIME</span>
  if (active) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">PREMIUM</span>
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">GRATUIT</span>
}

function UserActions({ user, onRefresh }: { user: User; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)
  const qc = useQueryClient()

  const mut = (fn: () => Promise<unknown>, msg: string) => async () => {
    try { await fn(); toast.success(msg); onRefresh(); setOpen(false) }
    catch { toast.error('Erreur — réessayez.') }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 glass border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-1 space-y-0.5">
            {/* Donner premium */}
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-primary/10 text-left"
              onClick={() => { setGrantOpen(!grantOpen); }}>
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span>Donner Premium</span>
              <ChevronDown className={cn('w-3 h-3 ml-auto transition-transform', grantOpen && 'rotate-180')} />
            </button>
            {grantOpen && (
              <div className="ml-6 space-y-0.5">
                {DURATIONS.map(d => (
                  <button key={d.value}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-secondary"
                    onClick={mut(
                      () => api.post(`/owner/users/${user.id}/grant`, { duration: d.value, source: 'owner' }).then(r => r.data),
                      `Premium ${d.label} accordé !`
                    )}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Retirer premium */}
            {user.premium && (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive text-left"
                onClick={mut(
                  () => api.post(`/owner/users/${user.id}/revoke`).then(r => r.data),
                  'Premium retiré'
                )}>
                <CalendarX className="w-3.5 h-3.5" />
                Retirer Premium
              </button>
            )}

            {/* Prolonger */}
            {user.premium && (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary text-left"
                onClick={mut(
                  () => api.post(`/owner/users/${user.id}/extend`, { days: 30 }).then(r => r.data),
                  '+30 jours ajoutés'
                )}>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                Prolonger +30j
              </button>
            )}

            <div className="border-t border-border/50 my-1" />

            {/* Suspend / Réactiver */}
            {user.is_active ? (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive text-left"
                onClick={mut(
                  () => api.post(`/owner/users/${user.id}/suspend`).then(r => r.data),
                  'Compte suspendu'
                )}>
                <UserX className="w-3.5 h-3.5" />
                Suspendre
              </button>
            ) : (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-green-400/10 text-green-400 text-left"
                onClick={mut(
                  () => api.post(`/owner/users/${user.id}/reactivate`).then(r => r.data),
                  'Compte réactivé'
                )}>
                <UserCheck className="w-3.5 h-3.5" />
                Réactiver
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OwnerUsersPage() {
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['owner-users', search, plan, page],
    queryFn: () => api.get('/owner/users', {
      params: { q: search, plan, limit, offset: page * limit }
    }).then(r => r.data as { users: User[]; total: number }),
    staleTime: 30_000,
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Gestion Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{total} utilisateur{total > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Rechercher…"
            className="w-full h-9 pl-9 pr-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        {(['', 'free', 'premium', 'suspended'] as const).map(p => (
          <button key={p} onClick={() => { setPlan(p); setPage(0) }}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              plan === p ? 'gradient-brand text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
            {p === '' ? 'Tous' : p === 'free' ? 'Gratuit' : p === 'premium' ? 'Premium' : 'Suspendus'}
          </button>
        ))}
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {['Utilisateur', 'Contact', 'Plan', 'Expiration', 'Source', 'Inscription', 'Activité', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Aucun utilisateur trouvé</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={cn('border-b border-border/30 hover:bg-secondary/30 transition-colors',
                  !u.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-xs">{u.full_name || '—'}</p>
                        {!u.is_active && <span className="text-[9px] text-destructive">Suspendu</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">{u.email}</p>
                    {u.phone && <p className="text-[10px] text-muted-foreground">{u.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge premium={u.premium} ends={u.premium_ends} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.premium_ends
                      ? new Date(u.premium_ends).getFullYear() > 9000 ? '∞ À vie'
                        : new Date(u.premium_ends).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full',
                      SOURCE_COLORS[u.subscription_source || 'chariow'] || 'bg-secondary text-muted-foreground')}>
                      {SOURCE_LABELS[u.subscription_source || 'chariow'] || u.subscription_source || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{u.login_count || 0} connexions</p>
                    {u.last_active_at && (
                      <p className="text-[10px]">{new Date(u.last_active_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions user={u} onRefresh={refetch} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>←</Button>
              <span className="px-3 py-1 text-xs flex items-center text-muted-foreground">{page + 1}/{pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}>→</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
