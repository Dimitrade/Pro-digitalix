'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Shield, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string; action: string; target_email: string | null; target_name: string | null
  actor_email: string | null; actor_name: string | null
  details: Record<string, unknown>; ip_address: string | null; created_at: string
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  premium_granted:     { label: 'Premium accordé',    color: 'bg-green-400/10 text-green-400' },
  premium_revoked:     { label: 'Premium retiré',     color: 'bg-red-400/10 text-red-400' },
  premium_extended:    { label: 'Premium prolongé',   color: 'bg-blue-400/10 text-blue-400' },
  lifetime_granted:    { label: 'Lifetime accordé',   color: 'bg-yellow-400/10 text-yellow-400' },
  account_suspended:   { label: 'Compte suspendu',    color: 'bg-orange-400/10 text-orange-400' },
  account_reactivated: { label: 'Compte réactivé',    color: 'bg-green-400/10 text-green-400' },
  payment_received:    { label: 'Paiement reçu',      color: 'bg-primary/10 text-primary' },
  promo_used:          { label: 'Promo utilisée',     color: 'bg-purple-400/10 text-purple-400' },
  promo_created:       { label: 'Promo créée',        color: 'bg-cyan-400/10 text-cyan-400' },
  promo_disabled:      { label: 'Promo désactivée',   color: 'bg-gray-400/10 text-gray-400' },
  plan_changed:        { label: 'Plan modifié',       color: 'bg-blue-400/10 text-blue-400' },
}

export default function OwnerAuditPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit', search, page],
    queryFn: () => api.get('/owner/audit', {
      params: { q: search, limit, offset: page * limit }
    }).then(r => r.data as { logs: AuditLog[]; total: number }),
    staleTime: 30_000,
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Journal d'Audit</h1>
            <p className="text-sm text-muted-foreground">{total} entrée{total > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Rechercher email, action…"
          className="w-full h-9 pl-9 pr-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {['Date & Heure', 'Action', 'Utilisateur ciblé', 'Par', 'Détails', 'IP'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-24" /></td>
                  ))}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun journal trouvé</td></tr>
              ) : logs.map(log => {
                const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'bg-secondary text-muted-foreground' }
                const d = new Date(log.created_at)
                return (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <p>{d.toLocaleDateString('fr-FR')}</p>
                      <p className="text-[10px]">{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="text-foreground">{log.target_name || '—'}</p>
                      {log.target_email && <p className="text-muted-foreground text-[10px]">{log.target_email}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.actor_name || log.actor_email || 'Système'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                      {Object.entries(log.details || {}).filter(([k]) => k !== 'note').map(([k, v]) => (
                        <span key={k} className="mr-2">{k}: <span className="text-foreground">{String(v)}</span></span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{log.ip_address || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>←</Button>
              <span className="px-3 py-1 text-xs flex items-center">{page + 1}/{pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}>→</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
