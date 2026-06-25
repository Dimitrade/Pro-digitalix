'use client'

import { useState } from 'react'
import {
  ShoppingCart, Search, Download, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, RefreshCw, DollarSign,
  TrendingUp, Package, Link2
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { salesApi } from '@/lib/api'
import { useChariowAccounts } from '@/hooks/useChariowAccount'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'

type StatusFilter = 'all' | 'paid' | 'pending' | 'refunded' | 'failed'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid:     { label: 'Payée',      color: 'text-green-400 bg-green-400/10',  icon: CheckCircle2 },
  pending:  { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  refunded: { label: 'Remboursée', color: 'text-blue-400 bg-blue-400/10',    icon: RefreshCw },
  failed:   { label: 'Échouée',    color: 'text-red-400 bg-red-400/10',      icon: XCircle },
  completed:{ label: 'Complétée',  color: 'text-green-400 bg-green-400/10',  icon: CheckCircle2 },
}

function NoAccountBanner() {
  return (
    <div className="glass rounded-xl p-10 text-center border border-primary/20">
      <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
        <Link2 className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">Aucune boutique connectée</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
        Connectez votre boutique Chariow pour visualiser vos commandes en temps réel.
      </p>
      <Link href="/integrations">
        <Button variant="gradient" size="sm">Connecter Chariow</Button>
      </Link>
    </div>
  )
}

export default function SalesPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: accounts, isLoading: accountsLoading } = useChariowAccounts()
  const accountId = accounts?.[0]?.id || null
  const currency = accounts?.[0]?.currency || 'XOF'

  const { data, isLoading } = useQuery({
    queryKey: ['sales', accountId, status, search, page],
    queryFn: () => salesApi.list(accountId!, { status: status === 'all' ? undefined : status, search, page, limit: 15 }),
    enabled: !!accountId,
  })

  const sales = data?.sales || []
  const metrics = data?.metrics || { total_revenue: 0, paid_count: 0, total_count: 0, avg_order: 0, items_sold: 0 }
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 15) || 1

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Commandes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historique et détail de toutes vos ventes.</p>
        </div>
        <Button variant="outline" size="sm" disabled={!accountId}>
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {!accountId && !accountsLoading && <NoAccountBanner />}

      {(accountId || accountsLoading) && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="CA total" value={formatCurrency(metrics.total_revenue, currency)} icon={DollarSign} iconColor="text-primary" loading={isLoading} />
            <MetricCard title="Commandes payées" value={formatNumber(metrics.paid_count)} sub={`${formatNumber(metrics.total_count)} au total`} icon={CheckCircle2} iconColor="text-green-400" loading={isLoading} />
            <MetricCard title="Panier moyen" value={formatCurrency(metrics.avg_order, currency)} icon={TrendingUp} iconColor="text-orange-400" loading={isLoading} />
            <MetricCard title="Produits vendus" value={formatNumber(metrics.items_sold)} icon={Package} iconColor="text-blue-400" loading={isLoading} />
          </div>

          {/* Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {(['all', 'paid', 'pending', 'refunded', 'failed'] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      status === s ? 'gradient-brand text-white' : 'hover:bg-secondary text-muted-foreground')}>
                    {s === 'all' ? 'Toutes' : STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Rechercher une commande…"
                  className="h-8 w-56 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Commande', 'Client', 'Produit', 'Montant', 'Statut', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      Aucune commande trouvée. Synchronisez votre boutique pour charger vos ventes.
                    </td></tr>
                  ) : sales.map((s: any) => {
                    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-primary">#{s.id?.toString().slice(-6) || '000001'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.customer_name || 'Client'}</p>
                            <p className="text-xs text-muted-foreground">{s.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground truncate max-w-[160px]">{s.product_name || s.items?.[0]?.name || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-foreground">{formatCurrency(s.total || s.amount, currency)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{formatDate(s.created_at)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{formatNumber(total)} commandes au total</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 text-sm text-foreground">Page {page} / {totalPages}</span>
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
